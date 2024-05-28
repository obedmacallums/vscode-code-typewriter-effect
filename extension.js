const vscode = require("vscode");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log(
        'Congratulations, your extension "code-typewriter-effect" is now active!'
    );

    let typingProcessRunning = false; // Variable to track if the typing process is running

    let typingSpeed = vscode.workspace
        .getConfiguration("code-typewriter-effect")
        .get("codeTypewriterEffectTypingSpeed");

    console.log(typingSpeed);

    let disposableType = vscode.commands.registerCommand(
        "code-typewriter-effect.retype",
        function () {
            if (typingProcessRunning) {
                return; // If the typing process is already running, do nothing
            }

            typingProcessRunning = true; // Mark that the typing process has started

            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            let text = editor.document.getText();
            let eol = editor.document.eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n"; // Detect EOL

            editor
                .edit((editBuilder) => {
                    editBuilder.delete(
                        new vscode.Range(0, 0, editor.document.lineCount, 0)
                    );
                })
                .then(() => {
                    type(0, 0);
                });

            function type(lineIndex, charIndex) {
                if (!typingProcessRunning) {
                    return; // If the typing process is stopped, exit the function
                }

                let lines = text.split(eol);
                if (lineIndex >= lines.length) {
                    typingProcessRunning = false; // Typing process is complete, reset the variable
                    return;
                }

                let line = lines[lineIndex];

                function insertNextCharacter() {
                    if (!typingProcessRunning) {
                        return; // If the typing process is stopped, exit the function
                    }

                    if (charIndex <= line.length) {
                        let char = line.charAt(charIndex) || "";
                        editor
                            .edit((editBuilder) => {
                                editBuilder.insert(
                                    new vscode.Position(lineIndex, charIndex),
                                    char
                                );
                            })
                            .then(() => {
                                charIndex++;
                                let delay
                                // If the character is... use a shorter delay
                                switch (char) {
                                    case " ":
                                    case "(":
                                    case ")":
                                    case "{":
                                    case "}":
                                    case "[":
                                    case "]":
                                        delay = 2;
                                        break;
                                    default:
                                        delay = typingSpeed;
                                        break;
                                }
                                // Move the selection to the current position to scroll the view
                                editor.revealRange(new vscode.Range(
                                    new vscode.Position(lineIndex, charIndex),
                                    new vscode.Position(lineIndex, charIndex)
                                ), vscode.TextEditorRevealType.Default);

                                setTimeout(insertNextCharacter, delay);
                            });
                    } else {
                        // Move to the next line without adding an extra newline when it's the last line
                        lineIndex++;
                        charIndex = 0;
                        if (lineIndex < lines.length) {
                            editor
                                .edit((editBuilder) => {
                                    editBuilder.insert(new vscode.Position(lineIndex - 1, lines[lineIndex - 1].length), eol);
                                })
                                .then(() => {
                                    setTimeout(() => type(lineIndex, charIndex), typingSpeed);
                                });
                        }
                    }
                }

                insertNextCharacter();
            }
        }
    );

    let disposableStop = vscode.commands.registerCommand(
        "code-typewriter-effect.stop",
        function () {
            typingProcessRunning = false; // When the "code-typewriter-effect.stop" command is executed, stop the typing process
        }
    );

    context.subscriptions.push(disposableType, disposableStop);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};