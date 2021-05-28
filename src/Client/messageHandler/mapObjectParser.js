const textParser = require('./textParser');

module.exports = function mapObjectParser(client) {
    let parseText = textParser();
    return (dataView, curPos, out) => {
        function parseTransforms() {
            out.x = dataView.getUint16(curPos, true); curPos += 2;
            out.y = dataView.getUint16(curPos, true); curPos += 2;
            out.width = dataView.getUint16(curPos, true); curPos += 2;
            out.height = dataView.getUint16(curPos, true); curPos += 2
        }

        function parseColor() {
            let hex;
            for (hex = dataView.getUint32(curPos, true).toString(16); hex.length < 6;) {
                hex = "0" + hex;
            }
            curPos += 4;
            out.color = "#" + hex;
        }

        var type = dataView.getUint8(curPos);
        curPos += 1;
        out.type = type;
        switch (type) {
            case 255:
                break;
            case 0:
                // TEXT OBJECT

                out.x = dataView.getUint16(curPos, true); curPos += 2;      // X coord
                out.y = dataView.getUint16(curPos, true); curPos += 2;      // Y coord
                out.size = dataView.getUint8(curPos); curPos += 1;          // Size
                out.isCentered = !!dataView.getUint8(curPos); curPos += 1;  // Is Centered
                let [ text, newCurPos ] = parseText(dataView, curPos); // Text String
                out.text = text;                                            // ...
                curPos = newCurPos;                                         // ...
                break;
            case 1:
                // WALL OBJECT (can be collidable)

                parseTransforms();
                let isCollidable = !out.color;
                parseColor();

                if (isCollidable) {
                    // Iterate on all Xs & Ys of this collidable wall and set collision map
                    
                    let _x = out.x | 0;
                    let _y = out.y | 0;
                    let _w = out.width | 0;
                    let _h = out.height | 0;
                    for (let iy = _y; iy < _y + _h; iy++) {
                        for (let ix = _x; ix < _x + _w; ix++) {
                            client.collisionMap[ix + 400 * iy]++;
                        }
                    }
                }
                break;
            case 2:
                // GREEN/RED OBJECT

                parseTransforms();
                out.isBad = !!dataView.getUint8(curPos); curPos += 1;    // Is Bad ?
                break;
            case 3:
                // INTERACTABLE OBJECT

                parseTransforms();
                out.count = dataView.getUint16(curPos, true); curPos += 2; // Count
                parseColor();
                break;
            case 4:
                // INTERACTABLE TIMER OBJECT

                parseTransforms();
                if (out.count) {
                    if (out.count > dataView.getUint16(curPos, true)) {
                        out.lastClickAt = t; // Last Click
                    }
                } else {
                    out.lastClickAt = 0; // Last Click = 0 (default)
                }
                out.count = dataView.getUint16(curPos, true); curPos += 2; // Count
                parseColor();
                break;
            default:
                throw Error('Unknown object type: ' + type);
        }
        return curPos;
    };
};