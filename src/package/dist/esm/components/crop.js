import React, { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "./cropImage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faRotateRight, faXmark } from "@fortawesome/free-solid-svg-icons";
function Crop({ isOpen = false, setOpenCrop, picture, saveCroppedPicture, iconSize, aspect }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(1);
    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);
    const showCroppedImage = async () => {
        try {
            const croppedImage = await getCroppedImg(picture.src, croppedAreaPixels, rotation);
            picture.src = await croppedImage;
            saveCroppedPicture(picture);
            setZoom(1);
            setRotation(0);
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
                    React.createElement(Cropper, { image: picture.src, crop: crop, zoom: zoom, aspect: aspect, onCropChange: setCrop, onCropComplete: onCropComplete, onZoomChange: setZoom, rotation: rotation })),
                React.createElement("div", { className: "d-flex align-items-center justify-content-between" },
                    React.createElement("input", { type: "range", className: "form-range ms-2", type: "range", value: zoom, min: 1, max: 3, step: 0.1, "aria-labelledby": "Zoom", onChange: (e) => {
                            setZoom(e.target.value);
                        } }),
                    React.createElement("button", { className: "btn btn-primary me-2", onClick: (e) => {
                            setRotation(rotation === 270 ? 0 : rotation + 90);
                        } },
                        React.createElement(FontAwesomeIcon, { icon: faRotateRight }))),
                React.createElement("div", { className: "modal-footer" },
                    React.createElement("button", { type: "button", onClick: () => { setOpenCrop(false); }, className: "btn btn-secondary" },
                        React.createElement(FontAwesomeIcon, { icon: faXmark })),
                    React.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => showCroppedImage() },
                        React.createElement(FontAwesomeIcon, { icon: faDownload })))))));
}
export default Crop;
//# sourceMappingURL=crop.js.map