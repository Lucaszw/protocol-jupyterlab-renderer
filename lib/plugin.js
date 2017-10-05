// Object.defineProperty(exports, "__esModule", { value: true });
const {Panel, FocusTracker} = require('@phosphor/widgets');
const {UIPluginLauncher} = require('@microdrop/jupyterlab_extension');
const MqttClient = require('@mqttclient/web');

const {ISignal, Signal} = require('@phosphor/signaling');

const MIME_TYPE = 'application/protocol+json';
const tracker = new FocusTracker();

class ProtocolLoader extends MqttClient {
    constructor(panel, model) {
        super("ProtocolLoader");
        this.listen();
    }
    listen() {
        this.bindTriggerMsg("protocol-model", "load-protocol", "load-protocol");
    }
    loadModel(model) {
        setTimeout(()=> {
            const msg = new Object();
            msg.protocol = model._data[MIME_TYPE];
            msg.__head__ = new Object(); // TODO: Add header info
            this.trigger("load-protocol", msg);
        }, 500);
    }
};

class RenderedProtocol extends Panel {
    constructor(options, tracker){
        console.log("OPTIONS:::");
        console.log(options);
        super();
        this.tracker = tracker;
        this.tracker.add(this);
        this.listen();
        this.protocolLoader = new ProtocolLoader(this); 
        setTimeout(()=> {
            this.pluginLauncher = new UIPluginLauncher(this);
            this.node.setAttribute("tabIndex", -1);
            this.node.style.outline = "0px";
            this.node.focus();
        }, 100);
    }
    listen() {
        this.tracker.currentChanged.connect(this.onCurrentChanged, this);
        this.tracker.activeChanged.connect(this.onActiveChanged, this);
    }
    onCurrentChanged(payload){
        console.log("Current changed");
        // console.log(this.tracker);
    }
    onActiveChanged(payload){
        console.log("Active changed");
        // console.log(this.tracker);
    }
    onAfterShow(msg) {
        console.log("After Show");
    }
    onUpdateRequest(msg){
        console.log("Update Request");
    }
    onActivateRequest(msg) {
        console.log("Active request");
        this.node.focus();
    }
    renderModel(model){
        console.log("Rendering Model...");
        this.node.focus();        
        return new Promise((resolve, reject) => {
            this.protocolLoader.loadModel(model);
            resolve(undefined);
        });
    }
};

const rendererFactory = {
    safe: true,
    mimeTypes: [MIME_TYPE],
    createRenderer: function (options) {
        console.log("RENDErING...");
        console.log(tracker);
        console.log(options);
        const plugin = new RenderedProtocol(options, tracker);
        plugin.id = `${Date.now()}:${Math.random()*1000}`;
        plugin.url = 'http://localhost:3000/protocol-ui-iframe/index.html';
        plugin.pluginName = 'protocol-ui';
        return plugin;
    }
};

module.exports = [
    {
        name: 'Protocol JSON',
        rendererFactory: rendererFactory,
        rank: 0,
        dataType: 'json',
        fileTypes: [{
                name: 'Protocol JSON',
                mimeTypes: [MIME_TYPE],
                extensions: ['.json', '.protocol.json', '.geojson'],
                // iconClass: ...
            }],
        documentWidgetFactoryOptions: {
            name: 'Protocol JSON',
            primaryFileType: 'Protocol JSON',
            fileTypes: ['Protocol JSON'],
            defaultFor: ['Protocol JSON']
        }
    }
];
