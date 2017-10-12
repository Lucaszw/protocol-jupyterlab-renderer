// Object.defineProperty(exports, "__esModule", { value: true });
const {FocusTracker, Panel, Widget} = require('@phosphor/widgets');
const {StepProtocol} = require('@microdrop/step_protocol_jlab_extension');

const MicrodropAsync = require('@microdrop/async');
const MqttClient = require('@mqttclient/web');
const {ISignal, Signal} = require('@phosphor/signaling');

const MIME_TYPES = ['application/json', 'application/protocol+json', 'application/uprotocol'];
const NAME = 'Protocol';

const focusTracker = new FocusTracker();
const microdrop = new MicrodropAsync();

const rendererFactory = {
    safe: true,
    mimeTypes: MIME_TYPES,
    createRenderer: function (options) {
      const file = options.resolver;
      const text = file.model.value.text;
      const panel = new Panel();
      const protocol = JSON.parse(text);
      // Setup Panel:
      panel.id = `${Date.now()}:${Math.random()*1000}`;
      panel.file = file;
      panel.title.label = protocol.name;
      panel.title.closable = true;
      panel.renderModel = async () => {return undefined};
      panel.node.setAttribute("tabIndex", -1);
      panel.node.style.outline = "0px";
      focusTracker.add(panel);

      // Load Protocol Into Microdrop:
      const load = async () => {
        let overwrite;
        const exists = await microdrop.protocol.loadProtocol(protocol);
        // If exists, require confirmation to overwrite protocol
        if (exists) {
          overwrite = confirm("Protocol already exists. Overwrite?");
          if (overwrite == true){
            await microdrop.protocol.loadProtocol(protocol, true);
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
      };

      load();
      return panel;
    }
};

module.exports = [
    {
        name: NAME,
        rendererFactory: rendererFactory,
        rank: 0,
        dataType: 'json',
        fileTypes: [{
                name: NAME,
                mimeTypes: MIME_TYPES,
                extensions: ['.json', '.uprotocol']
            }],
        documentWidgetFactoryOptions: {
            name: NAME,
            primaryFileType: NAME,
            fileTypes: [NAME],
            defaultFor: [NAME]
        }
    }
];
