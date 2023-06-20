import React, { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "./cropImage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faXmark } from "@fortawesome/free-solid-svg-icons";
function Crop({ isOpen = false, setOpenCrop, picture, saveCropedPicture, iconSize }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(1);
    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);
    const showCroppedImage = async () => {
        try {
            const croppedImage = await getCroppedImg(picture.src, croppedAreaPixels);
            picture.src = await croppedImage;
            saveCropedPicture(picture);
        }
        catch (e) {
            console.error(e);
        }
    };
    if (!isOpen) {
        return (React.createElement("div", null));
    }
    return (React.createElement("div", { className: "modal modal-dialog modal-dialog-centered modal-dialog-scrollable fade modal-xl show", style: { zIndex: 100000 } },
        React.createElement("div", { className: "modal-dialog" },
            React.createElement("div", { className: "modal-content", style: {
                    width: "500px",
                    height: "500px"
                } },
                React.createElement("div", { className: "modal-header" },
                    React.createElement("h1", { className: "modal-title fs-5", id: "staticBackdropLabel" }, "Crop Picture"),
                    React.createElement("button", { type: "button", className: "btn-close", "data-bs-dismiss": "modal", "aria-label": "Close", onClick: () => setOpenCrop(false) })),
                React.createElement("div", { className: "modal-body" },
                    React.createElement(Cropper, { image: picture.src, crop: crop, zoom: zoom, aspect: 4 / 3, onCropChange: setCrop, onCropComplete: onCropComplete, onZoomChange: setZoom })),
                React.createElement("div", { className: "modal-footer" },
                    React.createElement("button", { type: "button", onClick: () => { setOpenCrop(false); }, className: "btn btn-secondary" },
                        React.createElement(FontAwesomeIcon, { icon: faXmark })),
                    React.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => showCroppedImage() },
                        React.createElement(FontAwesomeIcon, { icon: faDownload })))))));
}
export default Crop;
//# sourceMappingURL=crop.js.map