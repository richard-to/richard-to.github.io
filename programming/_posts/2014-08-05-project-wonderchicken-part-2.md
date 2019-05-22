---
layout: post
title: "Project Wonderchicken - Part 2: Using optgroups with WTForms"
---

The optgroup tag is not used much with drop-down lists, so it is not surprising
that WTForms does not have an abstraction for optgroups. That is a not big deal
until one day they are actually needed. This was the case with Project
Wonderchicken last week, and as usual this led to a lot of googling. Eventually
I gave up and decided to create my own select field with optgroup support.

On a side note, I have hard time deciding whether HTML form abstractions are
worth the trouble, especially having worked with the Form module in Zend
Framework 1, which is great for basic forms, but once the layout grows more
complex, non-standard validations are added, and dynamic fields are required,
very little elegance is left. The learning curve can also slow new developers
down and this is not a good thing when they are volunteers. The general feedback
from them has been that ZendForm feels unnatural and prevents prototyping.
This can be partially solved by using View Script.

I have not used WTForms extensively enough to give an opinion on its ease of use
or API. As with ZendForm, there is no clear solution to handle frontend
validation other than duplicating validation rules. However, dynamic form fields
may actually be simpler to manage and the form rendering with Jinja2 is sensible.

Adding a select field with optgroups was a good way to become more familiar
with the codebase of WTForms. WTForms smartly separates the rendering from
the data and logic oriented aspect of forms. The rendering of elements are
delegated to Widget classes and the data/logic aspects reside in Field
classes.

In WTForms, `SelectField` and `SelectMultipleField` are sub-classed from
`SelectFieldBase`, which implements an `__iter__` method for looping through
options. It was unclear what use case this method was designed for, since the
`Select` widget uses `iter_choices` internally. This uncertainty made it
difficult to design the iteration for optgroups. The likely scenario would be
to return an `OptGroup` field to be further iterated through.

Instead of sub-classing `SelectFieldBase`, the new field `SelectOptGroupField`
is a child of `Field` and does not implement an `__iter__` method, at least for
now.

Another tricky aspect was deciding how to format the choices list. The current
solution tries to follow the format of `SelectField` and `SelectMultipleField`,
but it ends up being tedious to write by hand and requires some list manipulation
to format results from a database.

Here is an example of the format:

```
(
    (
        (
            ('Value 1', 'Label 1'),
            ('Value 2', 'Label 2'),
            ('Value 3', 'Label 3'),
        ),
        'Opt Group Label 1'
    ),
    (
        (
            ('Value 3', 'Label 3'),
            ('Value 4', 'Label 4'),
            ('Value 5', 'Label 5'),
        ),
        'Opt Group Label 2'
    ),
    ('Value 6', 'Label 6'),
    ('Value 7', 'Label 7'),
)
```

The last hurdle was handling the iteration of optgroups in the `iter_choices`
generator. The main reason is that it didn't seem right for the `SelectOptGroup`
widget to operate on an OptGroupField. The final solution ended up using a
lambda to iterate through optgroups and their options. This works, but I keep
debating whether I should have used a widget for the SelectOptGroup.

The following is the source code for my custom SelectOptGroup field and widget.
It was not too difficult to program, but did require jumping into the Github
repository and digging through code.

### SelectOptGroupField

```
from wtforms.compat import text_type
from wtforms.fields import Field
from wtforms.widgets import Option
from .widgets import SelectOptGroup


def iter_group(values, data, coerce):
    for value, label in values:
        selected = data is not None and coerce(value) in data
        yield (value, label, selected)


class SelectOptGroupField(Field):
    widget = SelectOptGroup(multiple=True)

    def __init__(self, label=None, validators=None, coerce=text_type, choices=None, **kwargs):
        super(SelectOptGroupField, self).__init__(label, validators, **kwargs)
        self.coerce = coerce
        self.choices = choices

    def iter_choices(self):
        for value, label in self.choices:
            if type(value) is not tuple:
                selected = self.data is not None and self.coerce(value) in self.data
                yield (value, label, selected)
            else:
                selected = False
                yield (lambda: iter_group(value, self.data, self.coerce), label, selected)

    def process_data(self, value):
        try:
            self.data = list(self.coerce(v) for v in value)
        except (ValueError, TypeError):
            self.data = None

    def process_formdata(self, valuelist):
        try:
            self.data = list(self.coerce(x) for x in valuelist)
        except ValueError:
            raise ValueError(self.gettext('Invalid choice(s): one or more data inputs could not be coerced'))

    def pre_validate(self, form):
        values = []
        if self.data:
            for v, _ in self.choices:
                value = v
                if type(v) is tuple:
                    values.extend([cv for cv, _ in v])
                values.append(v)
            for d in self.data:
                if d not in values:
                    raise ValueError(self.gettext("'%(value)s' is not a valid choice for this field") % dict(value=d))
```

### SelectOptGroup

```
from cgi import escape
from wtforms.compat import text_type
from wtforms.widgets import html_params, Select, HTMLString

class SelectOptGroup(object):
    def __init__(self, multiple=False):
        self.multiple = multiple

    def __call__(self, field, **kwargs):
        kwargs.setdefault('id', field.id)
        if self.multiple:
            kwargs['multiple'] = True
        html = ['<select %s>' % html_params(name=field.name, **kwargs)]
        for val, label, selected in field.iter_choices():
            if callable(val):
                html.append('<optgroup label="%s">' %  escape(text_type(label)))
                for child_val, child_label, child_selected in val():
                    html.append(Select.render_option(child_val, child_label, child_selected))
                html.append('</optgroup>')
            else:
                html.append(Select.render_option(val, label, selected))
        html.append('</select>')
        return HTMLString(''.join(html))
```
