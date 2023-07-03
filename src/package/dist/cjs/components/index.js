"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importStar(require("react"));
require("../assets/style/index.scss");
const react_fontawesome_1 = require("@fortawesome/react-fontawesome");
const free_solid_svg_icons_1 = require("@fortawesome/free-solid-svg-icons");
const react_drag_reorder_1 = require("react-drag-reorder");
const crop_1 = tslib_1.__importDefault(require("./crop"));
const ERROR = {
    NOT_SUPPORTED_EXTENSION: 'NOT_SUPPORTED_EXTENSION',
    FILESIZE_TOO_LARGE: 'FILESIZE_TOO_LARGE'
};
const UploadPictures = (0, react_1.forwardRef)(({ title = "upload pictures", imgExtension = ['.jpg', '.jpeg', '.gif', '.png'], maxFileSize = 5242880, width = "200px", sizModal = "modal-xl", iconSize = "lg", drag = false, crop = false, savePictures, multiple = true, aspect = 4 / 3, errorsMessages = {
    NOT_SUPPORTED_EXTENSION: 'not supported extension',
    FILESIZE_TOO_LARGE: 'file size too large'
} }, ref) => {
    (0, react_1.useImperativeHandle)(ref, () => ({
        openModal(status) {
            setOpen(status);
        }
    }));
    const [open, setOpen] = (0, react_1.useState)(false);
    const [pictures, setPictures] = (0, react_1.useState)([]);
    const [errors, setErrors] = (0, react_1.useState)([]);
    const [srcCrop, setSrcCrop] = (0, react_1.useState)(false);
    const [openCrop, setOpenCrop] = (0, react_1.useState)(false);
    const [indexCrop, setIndexCrop] = (0, react_1.useState)(false);
    const hasExtension = (fileName) => {
        const pattern = '(' + imgExtension.join('|').replace(/\./g, '\\.') + ')$';
        return new RegExp(pattern, 'i').test(fileName);
    };
    const readFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                let dataURL = e.target.result;
                dataURL = dataURL.replace(";base64", `;name=${file.name};base64`);
                resolve({ file, dataURL });
            };
            reader.readAsDataURL(file);
        });
    };
    const onFileChange = event => {
        setErrors([]);
        let allFilePromises = [];
        let fileError = [];
        let fileErrors = [];
        if (event.target.files) {
            Array.from(event.target.files).map((file) => {
                if (!hasExtension(file.name)) {
                    fileError = Object.assign(fileError, {
                        type: ERROR.NOT_SUPPORTED_EXTENSION
                    });
                    fileErrors.push(fileError);
                }
                if (file.size > maxFileSize) {
                    fileError = Object.assign(fileError, {
                        type: ERROR.FILESIZE_TOO_LARGE
                    });
                    fileErrors.push(fileError);
                }
                if (fileErrors.length > 0) {
                    setErrors(fileErrors);
                    return false;
                }
                allFilePromises.push(readFile(file));
            });
            if (fileErrors.length === 0) {
                Promise.all(allFilePromises).then(newFilesData => {
                    let files = [];
                    newFilesData.forEach(newFileData => {
                        newFileData.file.src = newFileData.dataURL;
                        files.push(newFileData.file);
                    });
                    setPictures(files);
                });
            }
        }
    };
    const remove = (index) => {
        let newList = pictures.filter((_, i) => i !== index);
        setPictures(newList);
    };
    const getChangedPos = (currentPos, newPos) => {
        let index = [];
        let newList = pictures;
        let pic = newList.splice(currentPos, 1);
        newList.splice(newPos - 1, 0, pic[0]);
        setPictures(newList);
    };
    const DraggableRender = (0, react_1.useCallback)(() => {
        return (react_1.default.createElement(react_drag_reorder_1.Draggable, { onPosChange: getChangedPos }, pictures && pictures.map((picture, index) => (react_1.default.createElement("div", { className: "position-relative p-0 mx-2", key: index, style: { width: width } },
            react_1.default.createElement(Actions, { index: index, iconSize: iconSize, remove: remove, cropPicture: cropPicture, crop: crop }),
            react_1.default.createElement(Image, { picture: picture, height: width * aspect, width: width, className: "mb-4" }))))));
    }, [pictures]);
    const ImagesRender = (0, react_1.useCallback)(() => {
        return (react_1.default.createElement("div", { className: "row d-flex justify-content-center" }, pictures && pictures.map((picture, index) => (react_1.default.createElement("div", { className: "position-relative p-0 mx-2", key: index, style: { width: width } },
            react_1.default.createElement(Actions, { index: index, iconSize: iconSize, remove: remove, cropPicture: cropPicture, crop: crop }),
            react_1.default.createElement(Image, { picture: picture, height: width * aspect, width: width, className: "mb-4" }))))));
    }, [pictures]);
    const cropPicture = (index) => {
        let picture = pictures.find((_, i) => i === index);
        setSrcCrop(picture);
        setOpenCrop(true);
        setIndexCrop(index);
    };
    const saveCroppedPicture = (picture) => {
        setPictures(items => items.map((item, i) => i === indexCrop
            ? picture
            : item));
        setSrcCrop(false);
        setOpenCrop(false);
        setIndexCrop(false);
    };
    const sendPictures = () => {
        savePictures(pictures);
        setPictures(false);
        setOpen(false);
    };
    return (react_1.default.createElement("div", { ref: ref },
        crop && react_1.default.createElement(crop_1.default, { picture: srcCrop, isOpen: openCrop, setOpenCrop: setOpenCrop, saveCroppedPicture: saveCroppedPicture, iconSize: iconSize, aspect: aspect }),
        open &&
            (react_1.default.createElement("div", { className: "modal modal-dialog modal-dialog-centered modal-dialog-scrollable fade " + sizModal + (open ? " show" : ""), tabIndex: "-1", id: "exampleModal" },
                react_1.default.createElement("div", { className: "modal-dialog" },
                    react_1.default.createElement("div", { className: "modal-content" },
                        react_1.default.createElement("div", { className: "modal-header" },
                            react_1.default.createElement("h1", { className: "modal-title fs-5", id: "exampleModalLabel" }, title),
                            react_1.default.createElement("button", { type: "button", className: "btn-close", onClick: () => { setOpen(false); setPictures([]); } })),
                        react_1.default.createElement("div", { className: "modal-body" },
                            errors.length > 0 && (react_1.default.createElement("div", null, errors.map((error, key) => (react_1.default.createElement("div", { className: "alert alert-warning", key: key, role: "alert" }, errorsMessages[error.type]))))),
                            react_1.default.createElement("div", { className: "row justify-content-center mb-5" },
                                react_1.default.createElement("div", { className: "mb-3", style: { width: "300px" } },
                                    react_1.default.createElement("input", { onChange: onFileChange, className: "form-control", type: "file", id: "formFile", multiple: multiple }))),
                            react_1.default.createElement("div", { className: "row d-flex justify-content-center" }, drag && pictures.length > 0 ? (react_1.default.createElement(DraggableRender, null)) : (react_1.default.createElement(ImagesRender, null)))),
                        react_1.default.createElement("div", { className: "modal-footer" },
                            react_1.default.createElement("button", { type: "button", onClick: () => { setOpen(false); setPictures([]); setErrors([]); }, className: "btn btn-secondary" },
                                react_1.default.createElement(react_fontawesome_1.FontAwesomeIcon, { icon: free_solid_svg_icons_1.faXmark })),
                            react_1.default.createElement("button", { type: "button", className: "btn btn-primary", onClick: sendPictures },
                                react_1.default.createElement(react_fontawesome_1.FontAwesomeIcon, { icon: free_solid_svg_icons_1.faDownload }))))),
                crop && react_1.default.createElement("div", { className: (openCrop ? "modal-backdrop fade show" : "") }))),
        react_1.default.createElement("div", { className: (open ? "modal-backdrop fade show" : "") })));
});
function Image({ picture, width, height }) {
    return react_1.default.createElement("img", { src: picture.src, style: {
            height: height,
            width: width,
        }, className: "mb-4" });
}
function Actions({ index, iconSize, remove, cropPicture, crop }) {
    return (react_1.default.createElement("div", { className: "d-flex w-100 justify-content-between p-0 pb-3" },
        crop && react_1.default.createElement(react_fontawesome_1.FontAwesomeIcon, { role: "button", onClick: () => cropPicture(index), icon: free_solid_svg_icons_1.faCropSimple, size: iconSize }),
        react_1.default.createElement(react_fontawesome_1.FontAwesomeIcon, { role: "button", onClick: () => remove(index), icon: free_solid_svg_icons_1.faXmark, size: iconSize })));
}
exports.default = UploadPictures;
//# sourceMappingURL=index.js.map