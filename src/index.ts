import {
	JupyterFrontEnd,
	JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IMainMenu } from '@jupyterlab/mainmenu';

import {
	INotebookTools, INotebookTracker//, NotebookActions
} from '@jupyterlab/notebook';

import { Cell } from '@jupyterlab/cells';

/**
 * Initialization data for the toon_note extension.
 */

const comicTag = 'comic';
const intermediateTag = 'intermediate';
const imgTag = 'img';
const md_bottom = 'bottom';
const md_stack = 'stack';
const fm_full = 'full';
const fm_half = 'half';
const fm_third = 'third';
const fm_twothird = 'twothird';
const notebookWidth = "1100px";

var notebookTools: INotebookTools;
var notebookTracker: INotebookTracker;

let showingComic = false;

const extension: JupyterFrontEndPlugin<void> = {
	id: 'toon_note:plugin',
	requires: [IMainMenu, INotebookTools, INotebookTracker],
	autoStart: true,
	activate: (app: JupyterFrontEnd,
		mainMenu: IMainMenu | null,
		notebook: INotebookTools | null,
		tracker: INotebookTracker
	) => {
		console.log('JupyterLab extension toon_note is activated!');

		const { commands } = app;

		const comicCommand = 'viewmenu:command';
		const intermediateCommand = 'viewmenu:intermediatecommand';

		notebookTools = notebook;
		notebookTracker = tracker;

		//NotebookActions.executed.connect(onCellExecute);

		notebookTracker.currentChanged.connect(() => {
			setTimeout(() => {
				//jp-NotebookPanel-notebook
				let notebookNode = notebookTracker.currentWidget.node.getElementsByClassName("jp-NotebookPanel-notebook").item(0) as HTMLElement;
				notebookNode.style.width = notebookWidth;
				notebookNode.style.minWidth = notebookWidth;
				notebookNode.style.maxWidth = notebookWidth;
			}, 10000);
		});

		commands.addCommand(comicCommand, {
			label: 'Comic Command',
			isToggled: () => showingComic,

			execute: () => {

				showingComic = !showingComic;

				//logToCSV('View Comic:' + showingComic);

				let cellWidgets = notebook.activeNotebookPanel.content.widgets;

				for (let i = 0; i < cellWidgets.length; ++i) {

					var cell = cellWidgets[i];

					var isComicTag = false;

					if (IsComicCell(cell)) {
						isComicTag = true;

						if (cell.model.type == 'code') {
							formatOutputArea(cell, showingComic);
						}
						else if (cell.model.type == 'markdown') {
							if (showingComic) {
								cell.hide();
							} else {
								cell.show();
							}
						}

						//return to notebook view and current intermediate setting
						if (!showingComic && IsIntermediateCell(cell)) {
							if (showingIntermediate) {
								cell.show();
							}
							else {
								cell.hide();
							}
						}
					}

					if (!isComicTag) {
						//not a comic cell
						if (showingComic) {
							cell.node.style.setProperty('display', 'none');
						} else {
							cell.node.style.setProperty('display', '');
						}
					}
				}

				if (showingComic) {

					for (let i = 0; i < cellWidgets.length; ++i) {

						var cell = cellWidgets[i];

						if (IsComicCell(cell) && cell.model.type == 'code') {
							var elements = getOutputAreaElements(cell.node);

							fixComicLayout(elements.output_arr[0].item(0).parentElement as HTMLElement, cell);
						}
					}
				}

				notebook.activeCell.node.scrollIntoView(true);
			}
		});

		let showingIntermediate = false;

		commands.addCommand(intermediateCommand, {
			label: 'intermediate',
			isToggled: () => showingIntermediate,
			execute: () => {

				showingIntermediate = !showingIntermediate;

				//logToCSV('View Intermediate:' + showingIntermediate);

				let cellWidgets = notebook.activeNotebookPanel.content.widgets;

				for (let i = 0; i < cellWidgets.length; ++i) {

					var cell = cellWidgets[i];

					if (IsIntermediateCell(cell)) {

						if (showingIntermediate) {
							cell.show();
						}
						else {
							cell.hide();
						}
					}
				}

				notebook.activeCell.node.scrollIntoView(true);
			}
		});

		if (mainMenu) {
			mainMenu.viewMenu.addGroup([{ command: comicCommand }]);
			mainMenu.viewMenu.addGroup([{ command: intermediateCommand }]);
		}

		commands.addKeyBinding({
			command: comicCommand,
			args: {},
			keys: ['Accel Shift C'],
			selector: '.jp-Notebook'
		});

		commands.addKeyBinding({
			command: intermediateCommand,
			args: {},
			keys: ['Accel Shift I'],
			selector: '.jp-Notebook'
		});

	}
};

//function onCellExecute(slot: any, args: {
//	notebook: Notebook;
//	cell: Cell;
//}) {
//	if (args.cell.model.type == 'code') {
//		setTimeout(function () {
//			var codeCell = (<CodeCell>args.cell);
//			queuedMouseActions.push(codeCell.model.id);
//			queuedEventsElement.push(codeCell.outputArea.node);
//			if (queuedMouseActions.length > 0 && !isDispatchingEvents) {
//				dispatchEvents();
//				var myLoop = function () {
//					setTimeout(function () {
//						if (!isDispatchingEvents) {
//							applyCodeFrame(codeCell);
//							return;
//						}
//						myLoop();
//					}, 500);
//				};
//				myLoop();
//			}
//			else {
//				applyCodeFrame(codeCell);
//			}
//		}, 1000);
//	}
//}

function IsComicCell(cell: Cell): boolean {
	if (cell !== undefined) {
		let tags = cell.model.metadata.get('tags') as string[];

		if (tags) {
			if (tags.find((tag) => tag == comicTag || tag == intermediateTag)) {
				return true;
			}
		}
	}

	return false;
}

function IsIntermediateCell(cell: Cell): boolean {
	if (cell !== undefined) {
		let tags = cell.model.metadata.get('tags') as string[];

		if (tags) {
			if (tags.find((tag) => tag == intermediateTag)) {
				return true;
			}
		}
	}

	return false;
}

function IsImageCell(cell: Cell): boolean {
	if (cell !== undefined) {
		let tags = cell.model.metadata.get('tags') as string[];

		if (tags) {
			if (tags.find((tag) => tag == imgTag)) {
				return true;
			}
		}
	}

	return false;
}

function IsBottomMarkdown(cell: Cell): boolean {
	if (cell !== undefined) {
		let tags = cell.model.metadata.get('tags') as string[];

		if (tags) {
			if (tags.find((tag) => tag == md_bottom)) {
				return true;
			}
		}
	}

	return false;
}

function IsMarkdownStacked(cell: Cell): boolean {
	if (cell !== undefined) {
		let tags = cell.model.metadata.get('tags') as string[];

		if (tags) {
			if (tags.find((tag) => tag == md_stack)) {
				return true;
			}
		}
	}

	return false;
}


function getOutputAreaElements(node: HTMLElement) {

	var arr = [node.getElementsByClassName('jp-Cell-inputWrapper')];
	var output_arr = [node.getElementsByClassName('jp-Cell-outputWrapper')];
	var frame = output_arr[0].item(0).getElementsByClassName('jp-OutputArea-child').item(0) as HTMLElement;
	var codecell = arr[0].item(0);

	return { arr: arr, output_arr: output_arr, frame: frame, codecell: codecell };
};

function formatOutputArea(cell: Cell, showComicView: boolean) {
	var elements = getOutputAreaElements(cell.node);
	var arr = elements.arr;
	var frame = elements.frame;
	var codecell = elements.codecell;

	if (showComicView) {
		cell.show();

		set_frameStyle(frame, getComicWidth(cell), getComicHeight(cell));
		hide_matplot_executeResult(frame);
		graph_responsive(frame);
		codecell.setAttribute("style", "display: none;");
		img_cell_formatting(frame, cell);

		var markdownCell = findCorrespondingMarkdownCell(cell);

		if (markdownCell != null) {
			var markdown = markdownCell.node;

			let isBottom = IsBottomMarkdown(markdownCell);
			let markdownElement = markdownFunction(markdown, isBottom);
			//appending markdown
			frame.firstChild.after(markdownElement);

			if (IsMarkdownStacked(markdownCell)) {

				if (isBottom) {
					frame.getElementsByClassName("jp-OutputArea-output").item(0).setAttribute('style', "width:100%;overflow: hidden; margin-bottom:" + markdownElement.clientHeight + "px;");
				}
				else {
					frame.getElementsByClassName("jp-OutputArea-output").item(0).setAttribute('style', "width:100%;overflow: hidden; margin-top:" + markdownElement.clientHeight + "px;");
				}
			}

			//hide markdown cell if we're showing the comic view
			markdownCell.hide();
		}
	}
	else {  //reset to notebook view

		var new_f = document.getElementsByClassName('new_frame');

		if (new_f == null) {
			return;
		}

		var annobox = document.getElementsByClassName("annobox");

		arr[0].item(0).setAttribute("style", "display: ;");

		frame.setAttribute('style', '');
		frame.firstElementChild.setAttribute('style', 'display:;'); //show prompt

		//jp-Notebook-cell, reset style (style:width gets overwritten in comic view)
		frame.parentElement.parentElement.parentElement.setAttribute('style', '');

		if (annobox[0] != null) {
			for (var j = 0; j < annobox.length; j++) {
				annobox[j].remove();
			}
		}

		if (new_f[0] != null) {
			for (var j = 0; j < new_f.length; j++) {
				new_f[j].remove();
			}
		}
	}
}

//assumes comic frames have been applied to all cells
function fixComicLayout(notebookCellElement: HTMLElement, cell: Cell) {

	let cells = notebookTools.activeNotebookPanel.content.widgets;

	let currentIndex = cells.findIndex((tempCell) => tempCell == cell);
	let currentLeft = notebookCellElement.offsetLeft;
	let leftCellIndex = -1;
	for (let i = currentIndex - 1; i >= 0; --i) {
		if (IsComicCell(cells[i]) && cells[i].model.type == 'code' && cells[i].node.offsetLeft < currentLeft) {
			leftCellIndex = i;
			break;
		}
	}

	//already on the left side, do nothing
	if (leftCellIndex < 0) {
		return;
	}

	let heightDiff = notebookCellElement.offsetTop + notebookCellElement.clientHeight - (cells[leftCellIndex].node.offsetTop + cells[leftCellIndex].node.clientHeight);

	//right side extends farther
	if (heightDiff > 0) {
		if (heightDiff > notebookCellElement.clientHeight / 2) {

			let prevCellIndex = -1;
			for (let i = currentIndex - 1; i > leftCellIndex; --i) {
				if (IsComicCell(cells[i]) && cells[i].model.type == 'code' && cells[i].node.offsetLeft == currentLeft) {
					prevCellIndex = i;
					break;
				}
			}

			if (prevCellIndex > 0) {
				let prevNotebookCellElement = cells[prevCellIndex].node.getElementsByClassName("jp-Cell-outputWrapper").item(0).parentElement;
				let bottomMargin = ((cells[leftCellIndex].node.offsetTop + cells[leftCellIndex].node.clientHeight) - (prevNotebookCellElement.offsetTop + prevNotebookCellElement.clientHeight)) + 0.5;

				prevNotebookCellElement.style.marginBottom = "" + bottomMargin + "px";
			}

		}
		else {
			cells[leftCellIndex].node.style.marginBottom = "" + heightDiff + "px"
		}
	}
};

function set_frameStyle(frame: HTMLElement, widthTag: string, heightTag: string) {

	let notebookCell = frame.parentElement.parentElement.parentElement;

	notebookCell.setAttribute('style', 'width:100%; position:relative; float:left; resize:both; overflow:hidden; height:auto;');

	frame.style.backgroundColor = "white";
	frame.style.border = "solid 2px";
	frame.style.width = "100%";
	frame.style.height = "100%";
	frame.style.overflow = "hidden";
	frame.style.position = "relative";
	frame.style.margin = "0px !important";
	frame.style.float = "left";


	if (widthTag == fm_full) {
		notebookCell.style.width = '100%';
	}
	else if (widthTag == fm_third) {
		notebookCell.style.width = '33.3%';
	}
	else if (widthTag == fm_twothird) {
		notebookCell.style.width = '66.6%';
	}
	else {  //if (tag == fm_half)
		notebookCell.style.width = '50%';
	}

	if (heightTag != "") {
		notebookCell.style.height = heightTag;
	}

	// hide leftside part of the output
	frame.firstElementChild.setAttribute('style', 'display:none;');
};


function hide_matplot_executeResult(frame: any) {

	let childElements = frame.parentElement.getElementsByClassName('jp-OutputArea-executeResult');
	let firstChild = frame.parentElement.firstElementChild; //first child is exempt from being hidden, output with just text usually is last
	//TODO: see how long this solution last :)

	let lastChild = frame.parentElement.lastElementChild;

	if (childElements.length > 0) {

		for (let child of childElements) {
			if (child != firstChild && child == lastChild) {
				child.setAttribute('style', 'display:none');
			}
		}
	}

};

function getComicWidth(cell: Cell): string {
	if (cell !== undefined) {
		let tags = cell.model.metadata.get('tags') as string[];

		if (tags) {
			if (tags.find((tag) => tag == fm_full)) {
				return fm_full;
			} else if (tags.find((tag) => tag == fm_half)) {
				return fm_half;
			}
			else if (tags.find((tag) => tag == fm_third)) {
				return fm_third;
			} else if (tags.find((tag) => tag == fm_twothird)) {
				return fm_twothird;

			}
		}
	}

	return;
}

function getComicHeight(cell: Cell): string {
	if (cell !== undefined) {
		let tags = cell.model.metadata.get('tags') as string[];

		if (tags) {

			for (let i = 0; i < tags.length; ++i) {
				if (tags[i].startsWith("height")) {
					return tags[i].split(':')[1];     //should be "height:100px" or some similar number
				}
			}
		}
	}

	return "";
}

function graph_responsive(frame: any) {
	frame.firstElementChild.nextElementSibling.setAttribute('style', 'width:100%;overflow: hidden;');
}

function img_cell_formatting(frame: any, cell: Cell) {

	if (IsImageCell(cell)) {
		var img = frame.getElementsByClassName('jp-OutputArea-output');
		img[0].firstElementChild.setAttribute('style', 'width:100%; height:100%; object - fit: cover;');
	}
}


function findCorrespondingMarkdownCell(cell: Cell): Cell {
	let cells = notebookTools.activeNotebookPanel.content.widgets;

	for (let i = 0; i < cells.length; ++i) {
		if (cells[i] == cell) {
			let codeCount = 0;
			let markdownSplitIndex = -1;

			//find code cell index
			for (let j = i - 1; j >= 0; --j) {

				markdownSplitIndex = j;

				if (cells[j].model.type != 'code' || !IsComicCell(cells[j])) {
					break;
				}

				codeCount++;
			}

			//find markdown cell root
			for (let j = markdownSplitIndex; j >= 0; --j) {
				if (cells[j].model.type != 'markdown' || !IsComicCell(cells[j])) {

					let markdownCellIndex = j + 1 + codeCount;
					if (markdownCellIndex <= markdownSplitIndex) {
						return cells[markdownCellIndex];
					}
					else {
						//no annotation found
						break;
					}

					break;
				}
			}

			break;
		}
	}

	return null;
}

function markdownFunction(markdown: HTMLElement, isBottom: boolean) {
	var text = markdown.firstChild.nextSibling.lastChild.childNodes[2].textContent;

	let verticalPos = "top:0px;";

	if (isBottom) {
		verticalPos = "bottom:0px;";
	}

	var annotationbox = document.createElement('p');
	annotationbox.innerText = text;
	annotationbox.style.cssText = "color: black; border:1px solid black; z-index:1; background-color:white; width: auto; height:auto; position:absolute !important; margine:4px; font-size: large;" + verticalPos;
	annotationbox.setAttribute('class', 'annobox');

	return annotationbox;
}




export default extension;
