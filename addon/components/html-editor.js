import Component from '@ember/component';
import Quill from 'quill';
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';
import layout from '../templates/components/html-editor';

export default Component.extend({
  layout,
  classNames: ['html-editor'],
  update(){},

  didInsertElement() {
    const formatOptions = [
      'bold',
      'italic',
      'link',
      'script',
      'list',
    ];

    const options = {
      modules: {
        toolbar: this.element.querySelector('div:nth-of-type(1)'),
        history: true,
        clipboard: true,
      },
      formats: formatOptions,
      theme: 'snow'
    };
    const node = this.element.querySelector('div:nth-of-type(2)');
    this.quill = new Quill(node, options);
    this.handler = (delta, existing) => {
      // quill uses an internal Delta format https://github.com/quilljs/delta/
      // this requires that we compose together the changes ourselves
      const changes = existing.compose(delta);
      // we then use a special converter to go back into the HTML that our app expects
      const converter = new QuillDeltaToHtmlConverter(changes.ops, {});
      const html = converter.convert();
      this.update(html);
    };

    this.quill.on('text-change', this.handler);
  },
  willDestroyElement() {
    this.quill.off('text-change', this.handler);
  },
});
