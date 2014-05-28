---
layout: post
title: "Tips for using the LinkSprite Sim900 GSM shield with pcDuino v2"
---

This week I integrated the LinkSprite Sim900 GSM shield with a pcDuino v2. The latter can be thought of as a slightly more powerful Raspberry Pi with built-in WiFi and Arduino headers. The nice thing about the pcDuino v2 is that you can access the hardware interfaces using any programming language. Python and C libraries can be downloaded from Github, but be warned that the Python library is buggy and incomplete. There is enough implemented to get started with controlling the GPIO interfaces. Serial and SPI are missing, but regular python libraries exist. For the integration, I chose Python since this project involved string processing and some database storage. The only hardware access required was a serial connection to the GSM shield. This proved tricky and uncovered some quirks that others may find helpful.

![pcDuino v2 with GSM shield](/images/pcduino.jpg)

**Issue 1: Unable to establish serial connection with GSM Shield**

If you need to communicate with a shield using a serial interface, the pin modes for gpio0 and gpio1 need to be set to 3. The pcDuino [c_environment](https://github.com/pcduino/c_environment/) repository defines it as `IO_UART_FUNC` in [pin_arduino.h](https://github.com/pcduino/c_environment/blob/master/hardware/arduino/variants/sunxi/pins_arduino.h). Setting the pin mode is one of the steps in `Serial.begin()`, as can be seen in [Serial.cpp](https://github.com/pcduino/c_environment/blob/master/hardware/arduino/cores/arduino/Serial.cpp#L191-L192).

The [python library](https://github.com/pcduino/python-pcduino) only allows you to set the pin mode to `OUTPUT` or `INPUT`. The code defaults the pin mode to `0` if the value is not `1`. For simplicity, I modified the [gpio module](https://github.com/pcduino/python-pcduino/blob/master/Samples/blink_led/gpio/__init__.py) used by the blink led sample code. Unfortunately the pcduino module located at the root of the repository does not work out of the box.

Assuming you're using the gpio module referenced by the blink led sample, we just need to add the following function:

{% highlight python linenos %}
def enableUart():
    with open(_MODE_FD_PATH % 'gpio0', 'w') as f:
        f.write(str(IO_UART_FUNC))
    with open(_MODE_FD_PATH % 'gpio1', 'w') as f:
        f.write(str(IO_UART_FUNC))
{% endhighlight %}

You will also need to declare the variable `IO_UART_FUNC` and assign it a value of `3`.

Now a serial connection to the GSM shield can be established like this:

{% highlight python linenos %}
from serial import Serial
from gpio import enableUart

enableUart()
shield_serial = Serial('/dev/ttyS1', baudrate=115200, timeout=0)
{% endhighlight %}

**Issue 2: Garbled SMS text message when forwarding directly to serial**

There is example code to easily get started with receiving SMS text messages at [tronixstuff](http://tronixstuff.com/2014/01/08/tutorial-arduino-and-sim900-gsm-modules/). This code is written for the Arduino IDE, but it's easy to convert to Python.

The first thing you'll notice is that a bunch of gibberish gets printed to the console before and after the `+CMT` result code. This does not occur when using an Uno and the Arduino IDE serial monitor. It's not clear why this happens, but a simple workaround is to ignore everything until `+CMT` is encountered and then stop after the second CRLF. The first CRLF splits the header and the message body and the second signifies the end of the message.

The second, more critical issue, is that the SMS text message including the header gets garbled after 64 characters. This looks to be the input buffer size, so if we use the default 19200 baud rate, the serial input cannot be read fast enough. However if we up the baud rate to 115200, then the message is read perfectly. This works but does not make sense since the shield's baud rate is definitely 19200. This was tested by sending `AT` commands and listening for input with different baud rates. With the former, there is no response. And with the latter, gibberish shows up. To make matters more confusing, the `AT+CMGL` and `AT+CMGR` commands output complete text messages when using 19200 for the baud rate of the shield and the serial connection.

This appears to be a bug with the shield. It seems to be forwarding the incoming SMS text message input at an uncontrolled rate. When using the Arduino IDE and Software Serial, the SMS text message gets cut off at 64 characters*. 

To receive SMS text messages with the pcDuino v2, the GSM shield's baud rate needs to be set at 115200 using the following AT command: `AT+IPR=115200`. The serial connection also needs to be 115200.

Here is some rough sample code to read SMS text messages with python, GSM shield, and pcDuino v2. Make sure to download the gpio module from the pcduino python repository and make the change described in issue 1.

{% highlight python linenos %}
import argparse
import logging
import serial
from datetime import datetime
from gpio import enableUart

class Sim900(object):
    """
    Sends commands to and read input from Sim900 shield.
    """
    
    CRLF = "\r\n"
    CTRL_Z = chr(26)
    DELAY_SEC = 0.1

    def __init__(self, serial):
        self.serial = serial

    def send_cmd(self, cmd):
        """
        Sends AT commands to Sim900 shield. A CRLF
        is automatically added to the command.
        """
        self.serial.write(cmd)
        self.serial.write(Sim900.CRLF)
        time.sleep(Sim900.DELAY_SEC)

    def available(self):
        return self.serial.inWaiting()

    def read(self, num_chars=1):
        return self.serial.read(num_chars)

    def read_available(self):
        return self.serial.read(self.available())

    def change_baudrate(self, baudrate):
        """
        Shortcut for changing the Sim900's baudrate. Makes
        sure that the serial baudrate adjusts accordingly.
        """
        self.send_cmd("AT+IPR=" + str(baudrate))
        self.serial.baudrate = baudrate


class SMSReader(object):
    """
    Listens for incoming SMS text messages and extracts header and message for
    further processing.
    """

    DATA_BEGIN = "+CMT"
    DATA_END = "\r\n"

    MODE_LISTEN = 1
    MODE_MSG = 2

    def __init__(self, sim900):
        self.sim900 = sim900

    def init_reader(self, baudrate=115200):
        """
        Makes sure Sim900 shield is set to listen
        for incoming SMS text messages in text mode.

        For the PcDuino, a baudrate of 115200 is 
        required. Otherwise, SMS text message is garbled.

        Returns:
            Sim900 response to commands.
        """
        self.sim900.change_baudrate(baudrate)
        self.sim900.send_cmd("AT+CMGF=1")
        self.sim900.send_cmd("AT+CNMI=2,2,0,0,0")
        
        msg = ""
        while self.sim900.available() != 0:
            msg = self.sim900.read_available()
        return msg

    def listen(self):
        """
        Listens for incoming SMS text messages with +CMT response code.

        Returns:
            If SMS text message is found, header and message will be returned as 
            a string.

            If not message found, an empty string will be returned.
        """
        msg = ""
        mode = self.MODE_LISTEN
        while True:
            while self.sim900.available() != 0:
                data = self.sim900.read_available()                
                if mode == self.MODE_LISTEN and self.DATA_BEGIN in data:
                    msg += data
                    mode = self.MODE_MSG
                elif mode == self.MODE_MSG:
                    msg += data
                    if self.DATA_END in data:
                        mode = self.MODE_LISTEN
            if mode == self.MODE_LISTEN:
                break
        return msg

LOG_FILE = 'sensor.log'
LOG_LEVEL = logging.INFO
LOG_FORMAT = '%(levelname)s - %(message)s'

def main():

    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Run SMS text message reader.')
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

    # Need to initalize gpio0 and gpio1 to UART mode
    enableUart()

    # Creates a serial connection to Sim900 shield
    sim900 = Sim900(serial.Serial(port, baudrate=baudrate, timeout=0))

    # Listens for incoming SMS
    reader = SMSReader(sim900)

    print ""
    print "Sim900 SMS text message reader"
    print "----------------------"
    print ""
    print "Press CTRL+C to stop the program."
    print ""
    
    print reader.init_reader()

    while True:
        data = reader.listen()
        if len(data) > 0:
            logger.info("SMS received at {0}.".format(datetime.now().strftime("%m/%d/%Y %H:%M:%S")))
            logger.info(data.strip())


if __name__ == '__main__':
    main()              
{% endhighlight %}

*This is the maximum buffer size set by the Software Serial library. We can fix the issue by increasing the buffer size.

