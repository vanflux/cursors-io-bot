const fs = require('fs');

module.exports = (colMap, width, x, y) => {
    let height = Math.floor(colMap.length / width);

    function getColAt(x, y) {
        if (x < 0 || y < 0 || x >= width || y >= height) return 1;
        return colMap[x + y * width];
    }

    return {
        to: (dstX, dstY) => {
            let heatMap = new Int32Array(width * height).fill(-1);

            function getHeatAt(x, y) {
                if (x < 0 || y < 0 || x >= width || y >= height) return -1;
                return heatMap[x + y * width];
            }
            function setHeatAt(x, y, value) {
                if (x < 0 || y < 0 || x >= width || y >= height) return;
                heatMap[x + y * width] = value;
            }

            let queue = [];
            queue.push([0, dstX, dstY]);

            while(queue.length > 0) {
                let [heat, _x, _y] = queue.shift();
                
                if (getHeatAt(_x, _y ) != -1 || getColAt(_x, _y) != 0) continue;
                setHeatAt(_x, _y, heat);
                queue.push([heat + 1, _x + 1, _y]);
                queue.push([heat + 1, _x - 1, _y]);
                queue.push([heat + 1, _x, _y + 1]);
                queue.push([heat + 1, _x, _y - 1]);
            }

            return {
                debugColMap: (filename) => {
                    let str1 = '';
                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            str1 += getColAt(x, y) + '\t';
                        }
                        str1 += '\n';
                    }
                    fs.writeFileSync(filename, str1);
                },
                from: (srcX, srcY) => {
                    let curX = srcX;
                    let curY = srcY;
                    let curHeat = getHeatAt(curX, curY);
                    if (curHeat == -1) return null;

                    function getNextMove() {
                        let lH = getHeatAt(curX - 1, curY);
                        if (lH >= 0 && lH < curHeat) {
                            return { heat: lH, x: -1, y: 0 };
                        }
                        let rH = getHeatAt(curX + 1, curY);
                        if (rH >= 0 && rH < curHeat) {
                            return { heat: rH, x: 1, y: 0 };
                        }
                        let tH = getHeatAt(curX, curY - 1);
                        if (tH >= 0 && tH < curHeat) {
                            return { heat: tH, x: 0, y: -1 };
                        }
                        let bH = getHeatAt(curX, curY + 1);
                        if (bH >= 0 && bH < curHeat) {
                            return { heat: bH, x: 0, y: 1 };
                        }
                        return null;
                    }
                    
                    return {
                        next: () => {
                            let mov = getNextMove();
                            if (mov == null) return null;
                            curX += mov.x;
                            curY += mov.y;
                            curHeat = mov.heat;
                            while(true) {
                                let nextMov = getNextMove();
                                if (nextMov == null) break;
                                if (nextMov.x == mov.x && nextMov.y == mov.y) {
                                    curX += nextMov.x;
                                    curY += nextMov.y;
                                    curHeat = nextMov.heat;
                                } else {
                                    break;
                                }
                            }
                            return { x: curX, y: curY };
                        },
                    }
                },
            };
        },
    };
};