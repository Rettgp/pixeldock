export interface TextVdfObject {
    [key: string]: string | TextVdfObject;
}

const unescape = (value: string) =>
    value.replace(/\\(["\\nt])/g, (_, c) => {
        if (c === 'n') return '\n';
        if (c === 't') return '\t';
        return c;
    });

export function parseTextVdf(content: string): TextVdfObject {
    const lines = content.split(/\r?\n/).map((line) => line.trim());
    const stack: TextVdfObject[] = [{}];
    let currentKey = '';

    lines.forEach((line) => {
        if (line === '{') {
            const newObj = {};
            stack[stack.length - 1][currentKey] = newObj;
            stack.push(newObj);
        } else if (line === '}') {
            if (stack.length > 1) stack.pop();
        } else {
            const match = line.match(
                /^"((?:[^"\\]|\\.)*)"\s+"((?:[^"\\]|\\.)*)"/,
            );
            if (match) {
                const [, key, value] = match;
                stack[stack.length - 1][unescape(key)] = unescape(value);
            } else {
                const keyMatch = line.match(/^"((?:[^"\\]|\\.)*)"/);
                if (keyMatch) {
                    currentKey = unescape(keyMatch[1]);
                }
            }
        }
    });

    return stack[0];
}
