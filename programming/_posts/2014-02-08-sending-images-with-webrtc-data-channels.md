---
layout: post
title: "Sending Images with WebRTC Data Channels"
---


This is a repost of one of my recent [Stack Overflow answers](http://stackoverflow.com/questions/21585681/send-image-data-over-rtc-data-channel/21591458#21591458). Basically the question was how to send image data over WebRTC data channels. The question caught my eye because last weekend I was experimenting with WebRTC camera basics. I plan to do a write up about that experiment in an another post. In the meantime, you can check out the [demo here](/projects/webrtc). In terms of the Stack Overflow answer, I spent about three hours researching the issue and learned quite a bit about WebRTC.

The following is the repost of my answer with a few edits:

Here is a demo I wrote up just now: [http://richard.to/projects/datachannel-demo/](/projects/datachannel-demo/)

Note that I'm using local channels and am just displaying an image and not rendering onto a canvas. That should be easy to do. You may face issues when actually communicating with a remote device. I haven't tested it out yet since I don't want to set up the servers. Also this demo only works in Chrome. But should be straightforward to make work in Firefox.

This was a bit tricky to figure out since the WebRTC stuff is constantly changing. Not to mention Firefox and Chrome work slightly differently.

I'm going to focus on Chrome, since the error messages you got seemed related to Chrome, specifically *Uncaught NetworkError: Failed to execute 'send' on 'RTCDataChannel': Could not send data*. This issue was described here: [https://groups.google.com/forum/#!topic/discuss-webrtc/U927CZaCdKU](https://groups.google.com/forum/#!topic/discuss-webrtc/U927CZaCdKU)

This is due to the *RTP data channel* being rate limited. The link I gave you mentioned *3 KB/sec* and in my testing that sounds about right, possibly worse depending on how you chunk your data.

The good news is that after Chrome 31, you can use SCTP-based data channels. See here: [https://groups.google.com/forum/#!topic/discuss-webrtc/y2A97iCByTU](https://groups.google.com/forum/#!topic/discuss-webrtc/y2A97iCByTU).

That means instead of this:

{% highlight javascript linenos %}
window.localPeerConnection = new webkitRTCPeerConnection(servers,
  {optional: [{RtpDataChannels: true}]});
{% endhighlight %}

You can do something like this (probably can remove the second parameter):

{% highlight javascript linenos %}
window.localPeerConnection = new webkitRTCPeerConnection(servers,
  {optional: []});
{% endhighlight %}

I believe you will still be rate limited, but now it is *64kbps*. I may be wrong about this number. Can't find the link I read it from.

One good thing about the SCTP channel is that you can use a reliable data connection (TCP) instead of unreliable (UDP) and the data gets sent in order. I'm not positive about that. Once again, can't find the link.

Now, because of this, it seems you will have to chunk you data still. You can't send it all at the same time in Chrome. You can do that in Firefox though. I think Firefox handles the congestion control for you in this case.

The second thing you need to know is that blob data is not currently supported by Chrome. At least in regular Chrome 32. This means we have to send data as text if we want to use Chrome.

What we can do is turn our image data into base64 using *canvas.toDataURL()*. Here is an example of how that would work:

{% highlight javascript linenos %}
  var canvas = document.createElement('canvas');
  canvas.width = startimage.width;
  canvas.height = startimage.height;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(startimage, 0, 0, startimage.width, startimage.height);
  var data = canvas.toDataURL("image/jpeg");
{% endhighlight %}

Now that we have our data, we just need to break up the bas64 string:

Here is an implementation of chunking the data that I use in my demo above:

{% highlight javascript linenos %}
function sendData() {
  trace("Sending data");
  sendButton.disabled = true;
  var canvas = document.createElement('canvas');
  canvas.width = startimage.width;
  canvas.height = startimage.height;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(startimage, 0, 0, startimage.width, startimage.height);

  var delay = 10;
  var charSlice = 10000;
  var terminator = "\n";
  var data = canvas.toDataURL("image/jpeg");
  var dataSent = 0;
  var intervalID = 0;

  intervalID = setInterval(function(){
    var slideEndIndex = dataSent + charSlice;
    if (slideEndIndex > data.length) {
      slideEndIndex = data.length;
    }
    sendChannel.send(data.slice(dataSent, slideEndIndex));
    dataSent = slideEndIndex;
    if (dataSent + 1 >= data.length) {
      trace("All data chunks sent.");
      sendChannel.send("\n");
      clearInterval(intervalID);
    }
  }, delay);
}
{% endhighlight %}

The implementation is pretty straightforward, basically just using *setInterval*. You can mess around with the slice size and delay parameters. Also we need to set a terminator character to know when are message is finished. I just used a *\n* character. I want to note that this demo doesn't account for different messages being passed at the same time. To make that work, you'd need to think of a protocol that would help figure out which message is which.

Here is how the receiver would be implemented. It basically just keeps track of the data until it receives the terminator character, which I just used newline character.

{% highlight javascript linenos %}
  function handleMessage(event) {
    if (event.data == "\n") {
      endimage.src = imageData;
      trace("Received all data. Setting image.");
    } else {
      imageData += event.data;
      //trace("Data chunk received");
    }
  }
{% endhighlight %}

Hope this helps a bit. It was fun researching it. Not really sure if this would be the ideal solution for sending an image over WebRTC. There are some demos out there that do P2P file transfer and stuff. I guess it depends on your purpose.