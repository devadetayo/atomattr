# Angular
> Use Atomattr in Angular with static attributes in component templates. No module, directive or schema changes are needed.

## Setup

Install `atomattr`, add the stylesheet to the `styles` array of your project in `angular.json`, and start the engine in `main.ts`.

```json
"styles": ["node_modules/atomattr/dist/defaults.css", "src/styles.css"]
```

```ts
// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { startAtomAttr } from 'atomattr';
import { AppComponent } from './app/app.component';

startAtomAttr();
bootstrapApplication(AppComponent);
```

If you use server rendering, call `startAtomAttr()` only in the browser, for example inside `afterNextRender`.

## Write attributes in templates

Static attributes on native elements pass straight to the DOM, so the canonical Atomattr attributes work as written in a component template.

```ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <section display="flex" flex-col md-flex-row gap="4" p="6" rounded="2xl" bg="surface" border="border">
      <h2 font-size="xl" font-weight="bold">Atomattr in Angular</h2>
      <button px="4" py="2" rounded="lg" bg="primary" text="white" hover-bg="primary/80">Continue</button>
    </section>
  `,
})
export class CardComponent {}
```

## Dynamic values

Plain `[name]="value"` binds a DOM property, and Atomattr attributes are not properties. Use an attribute binding instead.

```ts
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-toggle',
  standalone: true,
  template: `
    <button px="4" py="2" rounded="lg" text="white" [attr.bg]="tone()" (click)="flip()">Toggle colour</button>
  `,
})
export class ToggleComponent {
  tone = signal('primary');
  flip() { this.tone.update(t => (t === 'primary' ? 'emerald-600' : 'primary')); }
}
```

## Things to watch

Angular 17 and later treat `@` in templates as control flow, so write a literal `@` as `&#64;`. Attribute names that contain `:` or start with `(`, `[` or `*` are reserved by Angular, and Atomattr attributes never do. Component encapsulation does not affect Atomattr, because rules are generated on the document rather than per component.
