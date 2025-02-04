# LiteLog Highlighter

This Visual Studio Code plugin is designed for <a href="https://github.com/SwordofMorning/litelog">LiteLog</a>, although it can be applied to any text in the editor.

The highlighting principle is based on **regular expression matching**.

## Usage

### Command Line

1. Press `CTRL + SHIFT + P` to open the VSC command palette.
2. Enter `LiteLog: Highlight Lines by Pattern`, then input a string. This string will be used for regular matching, and if a match is found, it will be highlighted.
3. Enter `LiteLog: Highlight Lines by Regex`, then input a regular expression. This regex will be used for regular matching, and if a match is found, it will be highlighted.
4. Enter `LiteLog: Clear All Highlights` to remove all highlighting.

### Right-Click Menu

This menu is only available in `.log` files.

1. Highlight String: In the editor, select one or more characters, then right-click and choose `LiteLog: Highlight Selected Content`.
2. Highlight Regex: In the editor, right-click and choose `LiteLog: Highlight Lines by Regex`, which is a shortcut to the command line option.
3. Clear Highlight: In the editor, right-click and choose `LiteLog: Clear All Highlights`, which is a shortcut to the command line option.
4. Change Log Level: In the editor, right-click and choose `LiteLog: Toggle Log Level Visibility`. This allows you to filter out logs that you do not want to display. For example, by unchecking the [k] option, you can block kernel logs.
5. Show Filtered Logs: In the editor, right-click and choose `LiteLog: Toggle Filtered View`. This will create a new tab displaying the filtered (by level) log file.