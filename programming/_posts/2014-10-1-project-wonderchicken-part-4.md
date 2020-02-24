---
layout: post
title: "Project Wonderchicken - Part 4: Select2"
---

Select2 is a great replacement for the HTML select element if extended functionality is required. The main downsides are that it requires jQuery and is not really mobile friendly. The former is not much of an issue since Project Wonderchicken uses jQuery, but it would be nice to have no dependencies. The API is well designed and the interface is fluid and simple.

In the past, I had to depend on a combination of plugins to satisfy various requirements. For example, the dropdown menus needed to be styled in a way that was not possible with a normal select element. Then there were fields that required auto-suggest and others that required hierarchical arrangement of options. Each of these plugins had their own default styles and way of storing selected values. This led to much tinkering with CSS styles, jQuery validation hacks, and server-side form validation libraries that expected certain formats for select menus.

Select2 replaces all three plugins and provides a single, consistent interface to work with. The hierarchical arrangement of data works in this case, because the data is limited to one level using opt-groups. When it came to auto-suggest, I considered Twitter typeahead.js, but it was not designed to work well with mobile devices and it takes some extra effort to style the results correctly. Not to mention it would be another plugin to integrate with client and server-side validation libraries.

For Project Wonderchicken, auto-suggest was required for a list of 3,000 colleges and universities. The amount of data was small enough that it could be loaded in one cached AJAX request and stored in local storage.

The Select2 documentation provides multiple ways to load array data. A hidden input must be used in this case.

Initially, the school data was loaded using the data parameter:

```js
$("#school-select").select2({
    data: schoolData
    formatSelection: format,
    formatResult: format,
    minimumInputLength: 3
});
```

This leads to the UI freezing as it searches through the list of schools. For example typing "Uni" will cause a huge slowdown due to the number of matches that will be found and needing to scan the whole list. From a quick scan of the source, it's not clear what algorithm they are using. Unfortunately there is no option to limit the number of matches, so this must be implemented manually. This requires implementing a query function.

The Select2 docs provide an example under "Lock selections", where they use preloaded data. This is not the most efficient example since they use `jQuery.each`, which is slower than a normal for loop. The explanation and example under the section "Loading Data" are somewhat misleading. Initially I thought the query function was only called once to load data, and I should have tried the example which would have explained the sample code that I was too impatient to read.

Once I understood how the query function worked, the main changes to example were using a `for` loop and adding a match limit to improve the search performance.

```js
$('#school-select').select2({
    query: function (query) {
        var data = {results: []};
        var queryLength = query.term.length;
        var queryTerm = query.term.toLowerCase();
        if (queryLength === 0) {
            query.callback(data);
            return;
        }

        var matches = 0;
        for (var i = 0; i < _numSchools; ++i) {
            if (_schoolsData[i].name.toLowerCase().indexOf(queryTerm) !== -1) {
                data.results.push({id: _schoolsData[i].id, text: _schoolsData[i].name });
                ++matches;
                if (matches > _resultLimit) {
                    break;
                }
            }
        }
        query.callback(data);
    },
    minimumInputLength: 3
});
```

In terms of jQuery validate integration, the latest version (3.5.1) works out of the box, except that the error message will not disappear when valid input is provided. This can be fixed by adding a change event listener:

```js
$('#school-select').select2().change(function(){
    $(this).valid();
});
```
