---
layout: post
title: "D3 Tick Marks Madness"
---

Recently I was working with `angular-dc`, a directive for `dc.js` which combines `d3` and `crossfilter`, and one of the issues I ran into was the placement of tick marks on a bar chart. The ticks marks are dynamically generated based on the domain, and the problem was that this led to inconsistent placement of the ticks. Ideally, I wanted a numeric value for the last tick of the y-axis for uniformity, but this did not always happen. This behavior becomes extremely noticeable when there are four bar charts aligned next to each other. To exacerbate matters, the chart was styled without axis lines. This combination of choices made it look like the charts were different heights.

Overall, a very minor aesthetic issue, yet details and polish are important. Was it worth spending three hours figuring out the issue? I would say yes, because it ended up being a fun problem to solve and the charts look better.

As usually I searched online for possible solutions. Unfortunately I didn't find any solutions that worked for me. After two hours of trying various hacks and workarounds, I decided that I would adjust the styles of the bar charts. If I was not able to control the ticks the way I wanted, then I could work with that behavior. So what I did was make the y-axis visible with tick marks and removed the grid lines. The solution was a compromise. At least users would see that the height of the charts were uniform, but aesthetically the ending tick mark was not a uniform distance between the numbered ticks.

But then--as always?--an idea came to me. I thought, in the case where the bar chart domain was 0 to 100, that the ticks were perfectly arranged. This made me wonder what other cases would the ticks be perfectly arranged. There had to be more.

Now I need to sidetrack a bit and give a bit more information about the design of these bar charts. First the bar charts are very small; they are only 100 pixels tall. So we needed to constrain the number of ticks to about three. D3 has a method to set the number of ticks, but turns out this is a guideline. D3 will try to get as close as possible based on its axis calculations. These two requirements or restrictions are some of the reasons why the tick mark arrangement was sub-optimal. And my solution most likely would not work for other use cases where the charts are taller and more ticks are permitted.

So as I tested different max values for the domain of the y-axis, I learned that the following values worked perfectly:

- 1
- 100
- 200
- 300
- 400
- 800
- 1,000
- 10,000
- 20,000
- 30,000

Some values that did not work:

- 500
- 12,000
- 25,000

Based on these results, I settled on the following heuristic given that my bar charts would be set to display values between 0 and 50,000 depending on the type of chart. Also the values, at this point, have already been preprocessed to be a nice round number--so no 123.43 or 564 or 10,123.11.

1. If the max value is less than 1.0, just set the max value to 1.0
2. If the first digit is 3 or less, then leave the number alone.
3. If the first digit is greater than 3, then increment to the next even number.
  - 500 would be turned into 600
  - 1,200 would be 2,000
  - 25,000 would be turned to 30,000

In terms of the preprocessing step, I needed to make sure the final tick would be greater than the max value in the bar chart and that the number would be a rounded number. Examples:

  - 123.43 = 200
  - 12,3434 = 13,000

Putting that all together, I ended with this function:

```javascript
var calcMax = function(value) {
  var divisor = Math.pow(10, value.toFixed(0).length - 1);
  var rounded = value - (value % divisor) + divisor;
  var single = rounded / divisor;
  if (single % 2 && single > 3) {
    return (single + 1) * divisor;
  } else {
    return rounded;
  }
}

var yAxisMax = (maxValue >= 1) ? calcMax(maxValue) : 1;
chart.y(d3.scale.linear().domain([0, yAxisMax]));
```
