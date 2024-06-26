import React, { useCallback, useState } from "react"
import Cropper from "react-easy-crop"
import getCroppedImg from "./cropImage"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFloppyDisk, faRotateRight, faXmark } from "@fortawesome/free-solid-svg-icons"

function Crop({ isOpen = false, setOpenCrop, picture, saveCroppedPicture, iconSize, aspect }) {

    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(1);

    const onRotationChange = useCallback((rotation) => {
        //setRotation();
    }, []);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);


    const showCroppedImage = async () => {
        try {
            const croppedImage = await getCroppedImg(
                picture.contents?.file?.src,
                croppedAreaPixels,
                rotation
            )
            picture.contents.file.src = await croppedImage
            saveCroppedPicture(picture);
            setZoom(1)
            setRotation(0)
        } catch (e) {
            console.error(e)
        }
    }

    if (!isOpen) {
        return (<div></div>)
    }

    return (
        <div className="modal modal-dialog modal-dialog-centered modal-dialog-scrollable fade modal-xl show" style={{ zIndex: 100000 }}>
            <div className="modal-dialog">
                <div className="modal-content modal-crop-content" style={{
                    maxWidth: "500px",
                    height: "500px",
                    position:"fixed", left: "50%", top: "calc(50% - 250px)", transform: "translateX(-50%)"
                }}>
                    <div className="modal-header">
                        <h1 className="modal-title fs-5" id="staticBackdropLabel">Crop Picture</h1>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => setOpenCrop(false)}></button>
                    </div>
                    <div className="modal-body">
                        <Cropper
                            image={picture.contents?.file?.src}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspect}
                            onCropChange={setCrop}
                            onRotationChange={onRotationChange}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                            rotation={rotation}
                        />
                    </div>
                    <div className="d-flex align-items-center justify-content-between">

                        <input
                            type="range"
                            className="form-range ms-2"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => {
                                setZoom(e.target.value)
                            }}
                        />
                        <button className="btn btn-primary me-2" onClick={(e) => {
                                setRotation(rotation === 270 ? 0 : rotation + 90)
                            }}>
                            <FontAwesomeIcon icon={faRotateRight} />
                        </button>

                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={() => { setOpenCrop(false); }} className="btn btn-secondary">
                            <FontAwesomeIcon icon={faXmark} />
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => showCroppedImage()}>
                            <FontAwesomeIcon icon={faFloppyDisk} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}




export default Crop;