// Object.defineProperty(exports, "__esModule", { value: true });
const {FocusTracker, Panel, Widget} = require('@phosphor/widgets');
const {StepProtocol} = require('@microdrop/step_protocol_jlab_extension');
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
      // Setup Panel:
      const panel = new Panel();

      panel.id = `${Date.now()}:${Math.random()*1000}`;
      panel.title.closable = true;
      panel.node.setAttribute("tabIndex", -1);
      panel.node.style.outline = "0px";
      panel.file = options.resolver;
      focusTracker.add(panel);

      panel.renderModel = async (model) => {
        console.log("model", model);
        let overwrite, protocol;
        const text = model.data[MIME_TYPE];

        // Initialize if file is blank
        if (text == ''){
          protocol = JSON.parse(await microdrop.protocol.newProtocol());
        } else {
          protocol = JSON.parse(text);
          console.log("loadingProtocol", protocol);
          var payload = await microdrop.protocol.loadProtocol(protocol);
          console.log("PAYLOAD::", payload);
          const exists = JSON.parse(payload).requireConfirmation;
          console.log("EXISTS::", exists);

          // If exists, require confirmation to overwrite protocol
          if (exists) {
            overwrite = confirm("Protocol already exists. Overwrite?");
            if (overwrite == true){
              console.log("loadingProtocol (2)", protocol);
              await microdrop.protocol.loadProtocol(protocol, true);
            }
          }
        }

        panel.interface = new StepProtocol(
          panel, undefined, focusTracker, protocol.name);

        // XXX: Hotfix to handle activeRequest propogation
        // using timeout since parent not immediately defined
        setTimeout(()=> {
          panel.parent.onActivateRequest = () => {
            panel.node.focus();
          };
        }, 1000);

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
