"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importStar(require("react"));
const react_easy_crop_1 = tslib_1.__importDefault(require("react-easy-crop"));
const cropImage_1 = tslib_1.__importDefault(require("./cropImage"));
const react_fontawesome_1 = require("@fortawesome/react-fontawesome");
const free_solid_svg_icons_1 = require("@fortawesome/free-solid-svg-icons");
function Crop({ isOpen = false, setOpenCrop, picture, saveCropedPicture, iconSize }) {
    const [crop, setCrop] = (0, react_1.useState)({ x: 0, y: 0 });
    const [zoom, setZoom] = (0, react_1.useState)(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = (0, react_1.useState)(1);
    const onCropComplete = (0, react_1.useCallback)((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);
    const showCroppedImage = async () => {
        try {
            const croppedImage = await (0, cropImage_1.default)(picture.src, croppedAreaPixels);
            picture.src = await croppedImage;
            saveCropedPicture(picture);
        }
        catch (e) {
            console.error(e);
        }
    };
    if (!isOpen) {
        return (react_1.default.createElement("div", null));
    }
    return (react_1.default.createElement("div", { className: "modal modal-dialog modal-dialog-centered modal-dialog-scrollable fade modal-xl show", style: { zIndex: 100000 } },
        react_1.default.createElement("div", { className: "modal-dialog" },
            react_1.default.createElement("div", { className: "modal-content", style: {
                    width: "500px",
                    height: "500px"
                } },
                react_1.default.createElement("div", { className: "modal-header" },
                    react_1.default.createElement("h1", { className: "modal-title fs-5", id: "staticBackdropLabel" }, "Crop Picture"),
                    react_1.default.createElement("button", { type: "button", className: "btn-close", "data-bs-dismiss": "modal", "aria-label": "Close", onClick: () => setOpenCrop(false) })),
                react_1.default.createElement("div", { className: "modal-body" },
                    react_1.default.createElement(react_easy_crop_1.default, { image: picture.src, crop: crop, zoom: zoom, aspect: 4 / 3, onCropChange: setCrop, onCropComplete: onCropComplete, onZoomChange: setZoom })),
                react_1.default.createElement("div", { className: "modal-footer" },
                    react_1.default.createElement("button", { type: "button", onClick: () => { setOpenCrop(false); }, className: "btn btn-secondary" },
                        react_1.default.createElement(react_fontawesome_1.FontAwesomeIcon, { icon: free_solid_svg_icons_1.faXmark })),
                    react_1.default.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => showCroppedImage() },
                        react_1.default.createElement(react_fontawesome_1.FontAwesomeIcon, { icon: free_solid_svg_icons_1.faDownload })))))));
}
exports.default = Crop;
//# sourceMappingURL=crop.js.map