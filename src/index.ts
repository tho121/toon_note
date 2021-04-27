import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the toon_note extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'toon_note:plugin',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension toon_note is activated!');
  }
};

export default extension;
