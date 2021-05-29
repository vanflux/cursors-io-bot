module.exports = function textParser() {
    return (dataView, curPos) => {
        let text = '';
        let charCode = 0;
        let byte = 0;
        while ((byte = dataView.getUint8(curPos)) != 0) {
            charCode <<= 8;
            charCode |= byte;
            if ((byte & 128) == 0) {
                text += String.fromCharCode(charCode);
                charCode = 0;
            }
            curPos++;
        }
        if (charCode != 0) {
            text += String.fromCharCode(charCode);
        }
        return [ text, curPos+1 ];
    };
};