import { useCallback, useState } from "react"
import Cropper from "react-easy-crop"
import getCroppedImg from "./cropImage"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faDownload, faXmark } from "@fortawesome/free-solid-svg-icons"

function Crop({ isOpen = false, setOpenCrop, picture, saveCropedPicture, iconSize }) {

    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(1)

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])


    const showCroppedImage = async () => {
        try {
            const croppedImage = await getCroppedImg(
                picture.src,
                croppedAreaPixels,
            )
            picture.src = await croppedImage
            saveCropedPicture(picture);
        } catch (e) {
            console.error(e)
        }
    }

    if (!isOpen) {
        return <></>
    }
    return (
        <div className="modal modal-dialog modal-dialog-centered modal-dialog-scrollable fade modal-xl show" style={{ zIndex: 100000 }}>
            <div className="modal-dialog">
                <div className="modal-content" style={{
                    width: "500px",
                    height: "500px"
                }}>
                    <div className="modal-header">
                        <h1 className="modal-title fs-5" id="staticBackdropLabel">Crop Picture</h1>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => setOpenCrop(false)}></button>
                    </div>
                    <div className="modal-body">
                        <Cropper
                            image={picture.src}
                            crop={crop}
                            zoom={zoom}
                            aspect={4 / 3}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={() => { setOpenCrop(false); }} className="btn btn-secondary">
                            <FontAwesomeIcon icon={faXmark} />
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => showCroppedImage()}>
                            <FontAwesomeIcon icon={faDownload} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}




export default Crop;