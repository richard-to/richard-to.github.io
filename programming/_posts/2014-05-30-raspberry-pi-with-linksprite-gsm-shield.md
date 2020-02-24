---
layout: post
title: "Tips for using the LinkSprite Sim900 GSM shield with Raspberry Pi"
---

The LinkSprite Sim900 GSM shield can work with a Raspberry Pi, but you will need an Arduino, a compatible USB cable, and an external power source for the shield. An Arduino board with a 16 MHz clock may be necessary.* In short, it works the same way as with your laptop, except for the extra power for the shield. This set up is not as clean compared to the pcDuino v2, but Raspberry Pis are more popular these days, so I thought it'd be interesting to see how it would work.

![Raspbbery Pi with GSM shield](/images/rasp-pi-sim900.jpg)

### Issue 1: Using software serial instead of hardware serial

Since we will need hardware serial to communicate with the Raspberry Pi and Arduino, software serial will be needed to communicate with the GSM shield. Software serial needs to be switched on by changing the position of two jumpers on the shield. Tronixstuff has a good tutorial on [how to set up and use the shield](http://tronixstuff.com/2014/01/08/tutorial-arduino-and-sim900-gsm-modules/).

### Issue 2: Garbled SMS text messages

The solution to this issue is the exact opposite of the pcDuino issue with garbled text messages. Increasing the baud rate to 115200 actually leads to an unresponsive device. The only way to change the baud rate back was to hook it up to the pcDuino again. At baud rates between 9600 and 57600, the messages get cut off or garbled. This is due to the 64 byte buffer set by Software Serial.

The buffer can be increased by altering the definition of `_SS_MAX_RX_BUFF` in `SoftwareSerial.h`. A buffer of 256 bytes should be enough given a max text message size of 160 characters and an additional 50 characters for the header and CRLF message delimiter. This is not too big a problem since Arduino is using an ATmega168 has 16Kbytes of memory.

Example message with header:

    +CMT: "+12223334444","","14/05/29,01:04:18-32"\r\nThe text message body goes here\r\n

The downside of this approach is that the buffer size needs to be manually adjusted in the header file. It would be nice if the library exposed an API that would allow the buffer size to be changed.

Another option to prevent the buffer from filling up too fast is to slow the baud rate down. After some trial and error, 4800 bps looks like the magic number to handle incoming SMS messages properly. The serial connection between Arduino and Raspberry Pi can be set to a faster baud rate. I used 9600 bps since it appeared that faster rates led to messages getting cut off - granted that hasn't been verified yet.

###  Issue 3: Adjusting the code for Raspberry Pis and slower baud rates

The original code I wrote for the pcDuino took into account a faster baud rate and a direct serial connection to the shield. With the Raspberry Pi, the Arduino acts as a mediator or proxy, so additional code is needed. One of the goals was to make sure that the python code would work seamlessly with both devices.

### Arduino sketch for mediating commands and responses

```cpp
#include <SoftwareSerial.h>
SoftwareSerial Sim900(7, 8);

char c = 0;

void setup()
{
  Serial.begin(9600);
  Sim900.begin(4800);
}

void loop()
{
  if (Serial.available() > 0)
  {
    c = Serial.read();
    Sim900.print(c);
  }

  if(Sim900.available() > 0)
  {
    c = Sim900.read();
    Serial.print(c);
  }
}
```

### Sim900 module for receiving incoming SMS

This is the relevant code to receiving incoming SMS text messages. I didn't include the classes to parse the text message body and store the data in a database since that's implementation specific.

```python
import re
import sqlite3
from time import sleep


class TextMsg(object):
    """
    Represents a text message with some meta data

    Args:
        phone_number: Example format format: +1223334444
        timestamp: Example format: 14/05/30,00:13:34-32
        message: Text message body with CRLF removed
    """

    def __init__(self, phone_number, timestamp, message):
        self.phone_number = phone_number
        self.timestamp = timestamp
        self.message = message.strip()

    def __eq__(self, other):
        return (isinstance(other, self.__class__)
            and self.__dict__ == other.__dict__)

    def __str__(self):
        return ', '.join([self.phone_number, self.timestamp, self.message])


class Sim900(object):
    """
    Sends commands and read input from Sim900 shield.

    Note that if you are sending commands to an Arduino,
    then the Arduino needs to be loaded with a sketch that
    proxies commands to the shield and also forwards the
    response through serial.

    With the pcDuino, this class communicates directly
    with the shield.
    """

    CRLF = "\r\n"
    CTRL_Z = chr(26)

    DELAY_AFTER_READ = 0.1

    def __init__(self, serial, delay=0.1):
        self.serial = serial
        self.delay = delay

    def send_cmd(self, cmd, delay=None):
        """
        Sends AT commands to Sim900 shield. A CRLF
        is automatically added to the command.

        Args:
            cmd: AT Command to send to shield
            delay: Custom delay after sending command. Default is 0.1s
        """
        self.serial.write(cmd)
        self.serial.write(Sim900.CRLF)

        sleep(delay if delay is not None else self.delay)

    def available(self):
        return self.serial.inWaiting()

    def read(self, num_chars=1):
        return self.serial.read(num_chars)

    def read_available(self):
        return self.serial.read(self.available())

    def read_all(self):
        """
        Attempts to read all incoming input even if the
        baud rate is very slow (ie 4800 bps) and only returns
        if no change is encountered.
        """
        msg = ""
        prev_len = 0
        curr_len = 0
        while True:
            prev_len = curr_len
            while self.available() != 0:
                msg += self.read_available()
                curr_len = len(msg)
                sleep(self.DELAY_AFTER_READ)
            if prev_len == curr_len:
                break
        return msg

class SMSReader(object):
    """
    Listens for incoming SMS text message and extracts
    header and message for further processing.

    Example format:
    +CMT: "+12223334444","","14/05/30,00:13:34-32"<CRLF>
    This is the text message body!<CRLF>

    Note that the GSM shield can be set to include other metadata
    in the +CMT header.
    """

    DATA_BEGIN = "+CMT"
    DATA_DELIM = "\r\n"

    NOT_FOUND = -1

    MSG_FORMAT = "\+CMT: \"(\+\d{11})\",\"\",\"(\d{2}\/\d{2}\/\d{2},\d{2}:\d{2}:\d{2}\-\d{2})\"\r\n(.*)\r\n"

    def __init__(self, sim900):
        self.sim900 = sim900
        self.sms_regex = re.compile(self.MSG_FORMAT)

    def init_reader(self):
        """
        Makes sure Sim900 shield is set to listen
        for incoming SMS text message in text mode.

        For the PcDuino, make sure to set the baudrate to
        115200. Otherwise, data will be garbled.

        This step can be skipped if you are sure that the
        shield is set correctly.

        For instance if you are proxying commands/responses
        through an Arduino, the Arduino sketch may already do
        this.

        Returns:
            Sim900 response to commands.
        """
        self.sim900.send_cmd("AT+CMGF=1")
        self.sim900.send_cmd("AT+CNMI=2,2,0,0,0")
        return self.sim900.read_all()

    def listen(self):
        """
        Listens for incoming SMS text message with +CMT response code.

        Returns:
            If SMS text message is found, TextMsg is returned

            If message not found, then None is returned
        """
        msg = self.sim900.read_all()
        return self.extract_sms(msg)

    def extract_sms(self, msg):
        """
        Extracts SMS text message just in case the message includes
        gibberish before or after.

        Returns:
            TextMsg object or None if content is not in the correct format
        """
        result = self.sms_regex.search(msg)
        return TextMsg(*result.groups()) if result else None
```

### An example of how to use the above module named sim900

```python
#! /usr/bin/env python
import argparse
from datetime import datetime
from gpio import enableUart
import logging
from serial import Serial
from sim900 import Sim900, SMSReader
from time import sleep


LOG_FILE = 'sensor.log'
LOG_LEVEL = logging.INFO
LOG_FORMAT = '%(levelname)s - %(message)s'


def main():

    # Parse command line arguments
    #
    # The default settings will work well for the pcDuino. If you
    # are using a laptop or Raspberry Pi, then you will need to set
    # the serial baud rate to 9600 and make sure the shield is running at
    # 4800. An alternative is to increase buffer size in the Arduino SoftwareSerial
    # library.
    parser = argparse.ArgumentParser(description='Run SMS Data Logger.')
    parser.add_argument('-p', '--port', help='Serial port', default='/dev/ttyS1')
    parser.add_argument('-b', '--baudrate', type=int, help='Baudrate of Sim900 GSM shield', default=115200)
    args = parser.parse_args()

    port = args.port
    baudrate = args.baudrate


    # Setup logger
    logging.basicConfig(level=LOG_LEVEL, format=LOG_FORMAT)

    logger = logging.getLogger()
    file_log_handler = logging.FileHandler(LOG_FILE)
    logger.addHandler(file_log_handler)

    formatter = logging.Formatter(LOG_FORMAT)
    file_log_handler.setFormatter(formatter)


    # Need to initalize gpio0 and gpio1 to UART mode if pcDuino.
    # If not pcDuino, just ignore the error.
    try:
        enableUart()
    except:
        pass

    # Creates a serial connection to Sim900 shield
    sim900 = Sim900(Serial(port, baudrate=baudrate, timeout=0), delay=0.5)

    # Listens for incoming SMS
    reader = SMSReader(sim900)

    # For non-pcDuino devices, there looks to be a delay before commands
    # are sent and read correctly. Waiting two seconds seems to work.
    print "Initializing serial connection..."
    sleep(2)

    print ""
    print "Sim900 SMS Data Reader"
    print "----------------------"
    print ""
    print "Press CTRL+C to stop the program."
    print ""

    print reader.init_reader()

    while True:
        text_msg = reader.listen()
        if text_msg is not None:
            logger.info("Text message received at {0}.".format(datetime.now().strftime("%m/%d/%Y %H:%M:%S")))
            logger.info(text_msg)


if __name__ == '__main__':
    main()
```

 \* I haven't been able to establish Software Serial connection with the shield using 8 MHz boards
