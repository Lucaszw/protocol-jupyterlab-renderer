// Object.defineProperty(exports, "__esModule", { value: true });
const {FocusTracker, Panel, Widget} = require('@phosphor/widgets');
const {StepProtocol} = require('@microdrop/step-protocol');
const MicrodropAsync = require('@microdrop/async');

const MIME_TYPE = 'text/plain';
const MIME_TYPES = ['text/plain', 'text/protocol+json', 'text/uprotocol'];
const NAME = 'Protocol';

const focusTracker = new FocusTracker();
const microdrop = new MicrodropAsync();

const rendererFactory = {
    safe: true,
    mimeTypes: MIME_TYPES,
    createRenderer: function (options) {
      let loaded = false;

      // Setup Panel:
      const panel = new Panel();

      panel.id = `${Date.now()}:${Math.random()*1000}`;
      panel.node.setAttribute("tabIndex", -1);
      panel.node.style.outline = "0px";
      panel.file = options.resolver;
      focusTracker.add(panel);

      panel.renderModel = async (model) => {
        if (loaded) return;
        loaded = true;

        let overwrite, protocol;
        const text = model.data[MIME_TYPE];

        // Initialize if file is blank
        if (text == ''){
          protocol = JSON.parse(await microdrop.protocol.newProtocol());
          panel.file.model.value.text = JSON.stringify(protocol);
          panel.file.save();
        } else {
          protocol = JSON.parse(text);
          await microdrop.protocol.loadProtocol(protocol, true);
        }

        panel.interface = new StepProtocol(
          panel, undefined, focusTracker, protocol.name);

        panel.parent.onActivateRequest = () => { panel.node.focus(); };
        return undefined;
      };

      return panel;
    }
};

module.exports = [
    {
        name: NAME,
        rendererFactory: rendererFactory,
        rank: 0,
        dataType: 'string',
        fileTypes: [{
                name: NAME,
                mimeTypes: MIME_TYPES,
                extensions: ['.txt', '.uprotocol']
            }],
        documentWidgetFactoryOptions: {
            name: NAME,
            primaryFileType: NAME,
            fileTypes: [NAME],
            defaultFor: [NAME]
        }
    }
];
