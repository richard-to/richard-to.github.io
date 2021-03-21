---
layout: post
title: "WebRTC Poker Game - Part 3: Tailwind CSS"
---

## CSS from scratch

In the past I used to believe in writing CSS from scratch for every project. I liked the separation of concerns between HTML markup and the stylistic presentation of that markup. This means I preferred minimal classes. And if I did use classes, I would chose a semantically appropriate name. I did not believe in grid systems since they added non-semantic names. And there was no chance I was going to apply any inline styles. These were the days before flexbox and grid layouts. These were the days of using floats to create multi-column layouts. The drawback of this was that the CSS I wrote was not reusable. The best I could do was copy and paste styles from one project to another.

## Bootstrap

These days I prefer to use [Bootstrap](https://getbootstrap.com/). I no longer feel inclined to spend hours tinkering with CSS. I have also come to appreciate Bootstrap 4's CSS utilities for adjusting margins and padding. They are a lifesaver since I no longer need to manually add these adjustments to a stylesheet (or to create my own margin/padding CSS utilities). Nor am I tempted to add the adjustments as inline styles or br tags.

## Tailwind

For this project, however, I decided to try [Tailwind CSS](https://tailwindcss.com/), which I have been curious about since it is a framework that appears to be based on the idea of using CSS utility classes. Instead of using inline styles, one can apply highly granular CSS classes to an HTML element to style it. This makes it so it is not necessary to create custom CSS. In addition each class is not affected by the cascading aspect of CSS.

Tailwind CSS feels like a lower level abstraction than Bootstrap. There are no components such as modals, alerts, dropdown, tooltips, etc in Tailwind. Instead, pre-built components appear to be part of Tailwind's business model (via Tailwind UI).

This is not a big deal, especially when working with React. For example, Bootstrap does not integrate seamlessly with React, especially components, such as modals and accordions. Instead, wrapper libraries are created to wrap Bootstrap components as React components. This works reasonably well, but one can imagine better alternatives.

With Tailwind, I can create a React component and use the classnames module to create dynamic css for a component.

## Example component

Here is an example of a component that mutes and unmutes audio.

```javascript
import { faMicrophone, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import classNames from 'classnames'
import { noop } from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'

const getMicButtonCss = (muted) => (
  classNames(
    {
      'text-gray-50': !muted,
      'text-red-500': muted,
    },

    'flex-1',

    'bg-gray-800',
    'hover:bg-gray-900',

    // Spacing
    'p-2',
  )
)


const OptionsBar = ({muted, onMuteVideo}) => {
  const icon = muted ? faMicrophoneSlash : faMicrophone
  const label = muted ? 'Unmute' : 'Mute'
  return (
    <div className="flex">
      <button className={getMicButtonCss(muted)} onClick={() => onMuteVideo(!muted)}>
        <FontAwesomeIcon icon={icon} /> {label}
      </button>
    </div>
  )
}

OptionsBar.defaultProps = {
  onMuteVideo: noop,
}

OptionsBar.propTypes = {
  muted: PropTypes.bool.isRequired,
  onMuteVideo: PropTypes.func,
}

export default OptionsBar
```

The main thing to notice here is that I am using normal CSS classes. Using Tailwind CSS does not affect how I normally would create a React component. In the end it is just CSS. Granted it is
highly processed CSS, but that is all taken care of by Tailwind.

## CSS in JS

Tailwind's approach can be contrasted with the CSS in JS design pattern that has become popularity in recent years. It is an approach that I have resisted so far. It is an intriguing concept. And I think it is important to constantly question accepted ways of doing things. React is a good example of this. React mixes HTML with JS, which in the past would be seen as bad programming practice.

Some benefits of CSS in JS are scoped styles for a component. This means that the cascading aspect of CSS is less of an issue. It is easier to follow the styles since they are in the same file as a the component. Since the style are coupled with the component so there would be less need to provide one's own custom styles. Since the CSS is mixed with JS, a developer can leverage dynamic styling based on state or props.

The reason I was not sold on CSS in JS was because I liked Bootstrap. I liked being able to apply a consistent design to all my components within an application.

So although it is nice to have bundled styles with a third party component, it is not so great if I cannot make the design consistent with my application.

It is also not great if I have to use a styling system that I do not use. CSS in JS has many different variations and approaches, such as [JSS](https://cssinjs.org/?v=v10.6.0) and [Styled Components](https://styled-components.com/). What if I want to use plain CSS/SASS with Bootstrap?

In the end, I would prefer to add custom styles to a component even if it is extra work. An example is the [react auto suggest component](http://react-autosuggest.js.org/) that I used for providing default betting options. The component is unstyled.

This auto suggest component is flexible in that it supports different theming approaches. You can use a stylesheet and add styles according to default class names. Alternatively you can specify your own class names. It also supports CSS Modules, Radium, JSS, and even inline styles.

To style this component I overrode their default classes with Tailwind CSS classes.

```javascript
  const theme = {
    container: 'relative',
    input: classNames(
      {
        'focus:ring-blue-600': !error,
      },
      {
        'border-red-500': error,
        'focus:ring-red-400': error,
        'text-red-500': error,
      },

      'border',
      'w-full',

      // focus
      'focus:outline-none',
      'focus:ring-2',

      // spacing
      'p-1',
      'md:p-3',


      // text
      'text-xs',
      'md:text-sm',
    ),
    suggestionsContainer: 'absolute bottom-9 md:bottom-14 left-0 right-0',
    suggestionsList: 'bg-white border-1 border-gray-300 rounded p-2 shadow-lg',
    suggestion: 'hover:bg-blue-100 cursor-pointer font-normal text-left p-1',
  }

  // Other code here

  return (
    <Autosuggest
      inputProps={inputProps}
      getSuggestionValue={suggestion => suggestion.value}
      onSuggestionsClearRequested={() => setSuggestions([])}
      onSuggestionsFetchRequested={() => setSuggestions(raiseSuggestions)}
      renderSuggestion={renderSuggestion}
      suggestions={suggestions}
      shouldRenderSuggestions={() => true}
      theme={theme}
    />
  )
```

Another drawback of CSS in JS is that it appears lower level than Tailwind. In some cases, I am literally writing CSS in JS. I think this is problematic, because it ignores how useful having a framework can be.

Even though Tailwind is a lower level abstraction than Bootstrap, it still provides a set of defaults, such as colors, rounded corners, shadows, text sizes, margins, and paddings. This allows for consistency. There's a difference between using `m-2` and `margin: 0.5em`. These would be equivalent in Tailwind. But the latter is easier to remember and provides consistency. It is sort of like using a string constant instead of a magic string. It prevents people from using 0.55em or 0.51em by accident.

I think the game changing idea of CSS in JS is that it reduces the impact of the cascade in CSS.

Tailwind clearly has also learned the importance of reducing the cascade. I believe that's one reason why Tailwind is so popular.

## Drawbacks of Tailwind

I think Tailwind is great. I will probably pick it over Bootstrap if given the choice. The value of pre-made components is not that great when using React.

With that said Tailwind is not perfect. Although the framework provides a consistent set of CSS utilities, it is still up to the developer to apply styles consistently in their application.

This is not easy to do, since the CSS styles are applied per element. I cannot simply apply a class called "accordion" to create an accordion like I would do in Bootstrap.

The Tailwind docs provide some strategies for handling [class duplication](https://tailwindcss.com/docs/extracting-components) and [base styles](https://tailwindcss.com/docs/adding-base-styles). However I did not find the solutions presented convincing.

I think initially it is preferable to take the utility class approach to components, especially early on in a project. As a project grows and as the styles need to remain consistent across multiple projects, it does become more and more problematic. But I think, it is important not to reach for abstractions prematurely, which is what would often happen when I wrote CSS from scratch.

The other drawback of Tailwind's utility class approach is that a moderately complicated component can consist of a lot of classes. It becomes hard to read the component markup due to the amount of noise. It also becomes difficult to understand what styles are being applied. This latter problem is not a huge deal since following cascading CSS styles can also be a non-trivial exercise.

In my poker game, my styles were relatively basic, so I was able to extract the styles from the component by using the classnames module which helps organize the styles a bit better and keeps the component markup less cluttered.
s
## Repository

The Github repository can be found here:

- [https://github.com/richard-to/poker](https://github.com/richard-to/poker)
