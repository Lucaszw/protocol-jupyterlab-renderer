// Object.defineProperty(exports, "__esModule", { value: true });
const {Panel} = require('@phosphor/widgets');
const {UIPluginLauncher} = require('@microdrop/jupyterlab_extension');

const MIME_TYPE = 'application/protocol+json';

class RenderedProtocol extends Panel {
    constructor(options){
        super();
    }
    renderModel(model){
        return new Promise((resolve, reject) => {
            new UIPluginLauncher(this);
            resolve(undefined);
        });
    }
};

const rendererFactory = {
    safe: true,
    mimeTypes: [MIME_TYPE],
    createRenderer: function (options) {
        console.log("Creating renderer...");
        console.log(options);
        const plugin = new RenderedProtocol(options);
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
