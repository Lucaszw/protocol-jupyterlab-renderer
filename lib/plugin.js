// Object.defineProperty(exports, "__esModule", { value: true });
const {FocusTracker, Panel, Widget} = require('@phosphor/widgets');
const {UIPluginLauncher} = require('@microdrop/jupyterlab_extension');
const MqttClient = require('@mqttclient/web');
const {ISignal, Signal} = require('@phosphor/signaling');
const $ = require('jquery');

const MIME_TYPE = 'application/protocol+json';
const tracker = new FocusTracker();
let view;

class RenderedProtocol extends Panel {
    constructor(options, view, tracker){
        super();
        this.linkHandler = options.linkHandler;
        this.mimeTypes = options.mimeType;
        this.resolver = options.resolver;
        this.sanitizer = options.sanitizer;
        
        this.view = view;
        this.tracker = tracker;
        this.tracker.add(this);
        this.model = null;
        this.init();     
        console.log(this);
    }
    init() {
        // XXX: Implement hotfix
        setTimeout(() => {
            this.toolbar = this.parent.layout.widgets[0];
            this.renderToolbar();
            this.listen();
            this.node.setAttribute("tabIndex", -1);
            this.node.style.outline = "0px";
            this.node.style.paddingTop = "20px";
            this.node.style.backgroundImage = "none";
            this.node.focus();
            this.parent.onActivateRequest = this.onActivateRequest.bind(this);            
        }, 100);
    }

    listen() {
        this.tracker.activeChanged.connect(this.loadModel, this);
    }

    get active(){
        if (!this.tracker.currentWidget) return false;
        return this.id == this.tracker.currentWidget.id;
    }

    onActivateRequest(msg) {
        this.node.focus();
    }

    save(e) {
        if (!this.active) {
            alert("Please activate protocol before saving.");
            return;
        }
        const dat = this.model.data[MIME_TYPE];
        dat.steps = this.view.steps;
        dat.device = this.view.device;
        this.resolver.model.value.text = JSON.stringify(dat);
        this.resolver.save();
    }

    renderModel(model){
        this.node.focus();
        this.model = model;

        return new Promise((resolve, reject) => {
            this.loadModel(this.tracker);
            resolve(this.model);
        });
    }
    
    loadModel(msg){
        const isActive = this.active;

        if (!isActive) {
            if (this.node.style.backgroundImage != "none") return;
            this.node.style.backgroundImage = `url(${this.view.screenshot})`;
            this.node.style.backgroundRepeat = "no-repeat";
            this.node.style.backgroundPositionY = "20px";
        }

        if (isActive) {
            if (this.contains(this.view.panel)) return;
            this.node.style.backgroundImage = "none";
            this.addWidget(this.view.panel);
            this.loadProtocol();
        }
        
    }
    
    loadProtocol() {
        if (!this.model) return;
        const msg = new Object();
        msg.protocol = this.model._data[MIME_TYPE];
        // msg.protocol.name = 
        msg.__head__ = new Object(); // TODO: Add header info
        this.view.trigger("load-protocol", msg);
    }

    renderToolbar() {
        const saveBtn = $(`
        <button class="p-Widget jp-mod-styled jp-Toolbar-button jp-SaveIcon jp-MaterialIcon jp-Toolbar-item" title="save">
        </button>`);

        const refreshBtn = $(`
        <button class="p-Widget jp-mod-styled jp-Toolbar-button jp-RefreshIcon jp-MaterialIcon jp-Toolbar-item" title="refresh">
        </button>
        `);

        saveBtn.on("click", this.save.bind(this));

        this.toolbar.node.removeAttribute("style");
        this.toolbar.node.appendChild(saveBtn[0]);
        this.toolbar.node.appendChild(refreshBtn[0]);
        this.toolbar.node.style.position
    }

};

const rendererFactory = {
    safe: true,
    mimeTypes: [MIME_TYPE],
    createRenderer: function (options) {
        if (!view) {
            const panel = new Panel();
            panel.url = 'http://localhost:3000/protocol-ui-iframe/index.html';
            UIPluginLauncher.prototype.name = `protocol-loader:${Math.random()*1000}`;
            UIPluginLauncher.prototype.onConnect = function() {
                this.screenshot = null;
                this.bindTriggerMsg("protocol-model", "load-protocol", "load-protocol");
                this.onStateMsg("step-model", "steps", (payload) => {
                    this.steps = JSON.parse(payload);
                });
                this.onStateMsg("device-model", "device", (payload) => {
                    this.device = JSON.parse(payload);
                });
                this.onSignalMsg("protocol-ui", "screenshot", (payload) => {
                    this.screenshot = JSON.parse(payload);
                });

                for (var s of this.subscriptions) this.client.subscribe(s);
            }
            view = new UIPluginLauncher(panel);
        }
        
        const plugin = new RenderedProtocol(options, view, tracker);
        plugin.id = `${Date.now()}:${Math.random()*1000}`;
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
