// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { outputFileSync } from 'fs-extra';
import { join } from 'path';
import * as vscode from 'vscode';
import { JsonToControl } from './converter';
import { snakeCase } from 'lodash';
import { parse } from 'yaml';
import { existsSync } from 'fs';


interface PubspecYaml {
	name: string;
	version: string;
	environment?: {
	  sdk: string;
	  [key: string]: any;
	};
	dependencies?: {
	  [key: string]: string;
	};
	dev_dependencies?: {
	  [key: string]: string;
	};
	jsonToControl?: JsonToControlConfig;
  }


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(
		vscode.commands.registerCommand('jsontocontrol.convertFromClipboard', async () => {
			convertToControl();
		}));
	context.subscriptions.push(
		vscode.commands.registerCommand('jsontocontrol.convertFromClipboardToFolder', async (e) => {
			convertToControl(e.path);
		}));
	context.subscriptions.push
		(vscode.commands.registerCommand('jsontocontrol.convertFromClipboardToFile', async (e) => {
			const path = e.path.toString() as string;
			const i = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1;
			convertToControl(e.path.substring(0, i), e.path.substring(i));
		}));
}

// this method is called when your extension is deactivated
export function deactivate() { }

class JsonToControlConfig {
    outputFolder: string = "lib";
    typeChecking: boolean | "ask" = false;
    nullValueDataType: string = "dynamic";
    nullSafety: boolean = false;
    copyWithMethod: boolean = false;
    mergeArrayApproach: boolean = true;
    checkNumberAsNum: boolean | "ask" = false;
}

async function convertToControl(folder?: string, file?: string) {
	const workspacePath = vscode.workspace.workspaceFolders?.map(e => e.uri.path) ?? [];
	let pubspecTree: PubspecYaml = {
		name: '',
		version: ''
	};
	const pubspecPath = join(...workspacePath, "pubspec.yaml");

	if (existsSync(pubspecPath)) {
		try {
			const pubspec = await vscode.workspace.openTextDocument(pubspecPath);
			pubspecTree = parse(pubspec.getText()) as PubspecYaml || {};
		} catch (e) {
			console.error("Error reading pubspec.yaml:", e);
		}
	}

	const jsonToControlConfig = pubspecTree.jsonToControl ?? {
		outputFolder: "lib",
		typeChecking: undefined,
		nullValueDataType: "dynamic",
		nullSafety: false,
		copyWithMethod: false,
		mergeArrayApproach: true,
		checkNumberAsNum: false
	};
	// Display a message box to the user
	const value = await vscode.window.showInputBox({
		placeHolder: file || folder ? "Class Name" : "package.Class Name\n",
	});

	if (!value || value === "") {
		return;
	}
	const typeCheck = jsonToControlConfig.typeChecking === true || 
    (jsonToControlConfig.typeChecking === "ask" && 
     (await vscode.window.showQuickPick(["Yes", "No"], {
         placeHolder: "Need type checking?"
     }) === "Yes"));
	let useNum = jsonToControlConfig.checkNumberAsNum ?? false;
	if (useNum === "ask") {
		useNum = (await vscode.window.showQuickPick(["Yes", "No"], {
			placeHolder: "Using number(num) checker on int & double value?"
		}) === "Yes");
	}

	const packageAndClass = value?.toString() ?? "";

	const paths = packageAndClass.split(".");
	const className = paths.pop() ?? "";
	let fileName: string;
	if (file) {
		fileName = file;
	} else {
		fileName = await filenameHandler(`${snakeCase(className)}.ctl`);
	}

	try {
		const filePath = folder ? join(folder.startsWith("/") || folder.startsWith("\\") ? folder.substring(1) : folder, fileName) : join(
			...(workspacePath),
			jsonToControlConfig.outputFolder,
			...paths, fileName);
		vscode.window.showInformationMessage(`Writing ${filePath}`);


		const data = await vscode.env.clipboard.readText();
		const obj = JSON.parse(data);
		const nullSafety = jsonToControlConfig.nullSafety ?? true;
		const mergeArrayApproach = jsonToControlConfig.mergeArrayApproach ?? false;
		const copyWithMethod = jsonToControlConfig.copyWithMethod ?? false;
		const nullValueDataType = jsonToControlConfig.nullValueDataType;
		const { tabSize } = vscode.workspace.getConfiguration("editor", { languageId: "control" });
		const converter = new JsonToControl(tabSize, typeCheck, nullValueDataType, nullSafety);
		converter.setIncludeCopyWitMethod(copyWithMethod);
		converter.setMergeArrayApproach(mergeArrayApproach);
		converter.setUseNum(useNum);
		const code = converter.parse(className, obj);
		const file = outputFileSync(filePath, code);
		vscode.window.showInformationMessage(`Converting done...`);
	} catch (e) {
		vscode.window.showErrorMessage(`${e}`);
	}
}

const filenameHandler = async (fileName: string): Promise<string> => {
	const confirmFilename =
		await vscode.window.showQuickPick(["Yes", "No"], {
			placeHolder: `Use ${fileName} as file name?`
		});

	if (confirmFilename !== "Yes") {
		const value = await vscode.window.showInputBox({
			placeHolder: "Please input file Name\n"
		});

		if (!value || value.trim() === "") {
			return await filenameHandler(fileName);
		} else {
			return value.endsWith(".ctl") ? value : value + ".ctl";
		}
	}
	return fileName;
};