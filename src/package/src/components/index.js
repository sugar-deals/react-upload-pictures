import React, { useCallback, useState, forwardRef, useImperativeHandle } from "react"

import "../assets/style/index.scss"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCropSimple, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Draggable } from "react-drag-reorder";
import Crop from "./crop";

const ERROR = {
  NOT_SUPPORTED_EXTENSION: 'NOT_SUPPORTED_EXTENSION',
  FILESIZE_TOO_LARGE: 'FILESIZE_TOO_LARGE',
  DIMENSION_IMAGE: "DIMENSION_IMAGE"
}

const UploadPictures = forwardRef((
  {
    title = null,
    imgExtension = ['.jpg', '.jpeg', '.gif', '.png'],
    maxFileSize = 5242880,
    height = "200px",
    width = "200px",
    classStyle = "",
    iconSize = "lg",
    drag = false,
    crop = false,
    savePictures,
    multiple = true,
    aspect = 4 / 3,
    instructions = null,
    errorsMessages = {
      NOT_SUPPORTED_EXTENSION: 'not supported extension',
      FILESIZE_TOO_LARGE: 'file size too large',
      DIMENSION_IMAGE: "please crop the image"
    },
    handleClose =  () => {}
  },
  ref
) => {
  useImperativeHandle(ref, () => ({
    sendPictures() {
      sendPictures();
    },
    getErrors() {
      return errors;
    },
    getPictures() {
      return pictures;
    }
  }));
  const [pictures, setPictures] = useState([])
  const [errors, setErrors] = useState([])
  const [srcCrop, setSrcCrop] = useState(false)
  const [openCrop, setOpenCrop] = useState(false)
  const [indexCrop, setIndexCrop] = useState(false)

  const hasExtension = (fileName) => {
    const pattern = '(' + imgExtension.join('|').replace(/\./g, '\\.') + ')$';
    return new RegExp(pattern, 'i').test(fileName);
  }

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
  }

  const onFileChange = event => {
    setErrors([]);
    let allFilePromises = []
    let fileError = [];
    let fileErrors = [];
    if (event.target.files) {
      Array.from(event.target.files).map((file) => {
        if (!hasExtension(file.name)) {
          fileError = Object.assign(fileError, {
            type: ERROR.NOT_SUPPORTED_EXTENSION,
            filename: file.name
          });
          fileErrors.push(fileError);
        }

        if (file.size > maxFileSize) {
          fileError = Object.assign(fileError, {
            type: ERROR.FILESIZE_TOO_LARGE,
            filename: file.name
          });
          fileErrors.push(fileError);
        }
        if (fileErrors.length > 0) {
          setErrors(fileErrors);
          return false
        }
        allFilePromises.push(readFile(file));
      })
      if (fileErrors.length === 0) {
        Promise.all(allFilePromises).then(newFilesData => {
          let files = []
          newFilesData.forEach(newFileData => {
            newFileData.file.src = newFileData.dataURL
            var image = new Image();
            image.src = newFileData.file.src;
            image.addEventListener('load', () => {
              const { width, height } = image;
              // check aspect ratio of the image
              debugger;
              if (aspect !== (width/height)) {
                fileErrors.push(
                  {
                    type: ERROR.DIMENSION_IMAGE,
                    filename: newFileData.file.name
                  }
                );
                if (errors.length > 0) {
                  setErrors([...errors, ...fileErrors])
                }
                else {
                  setErrors(fileErrors)
                }
              }
            });
            files.push(newFileData.file);
          });
          let oldPictures = pictures;
          setPictures(oldPictures.concat(files));
        });
      }
    }
  };

  const remove = (index) => {
    let newList = pictures.filter((_, i) => i !== index);
    setPictures(newList);
  }

  const getChangedPos = (currentPos, newPos) => {
    let index = [];
    let newList = pictures
    let pic = newList.splice(currentPos, 1);
    newList.splice(newPos - 1, 0, pic[0]);
    setPictures(newList)
  };

  const DraggableRender = useCallback(() => {

    return (
      <Draggable onPosChange={getChangedPos}>
        {
          pictures && pictures.map((picture, index) => (
            <div className="position-relative p-0 mx-2" key={index} style={{ width: width, height: height }}>
              <Actions index={index} iconSize={iconSize} remove={remove} cropPicture={cropPicture} crop={crop} />
              <ImageDisplay picture={picture} height={height} width={width} className="mb-4" />
            </div>
          ))
        }
      </Draggable>
    );
  }, [pictures]);


  const ImagesRender = useCallback(() => {

    return (
      <div className="row d-flex justify-content-center">
        {
          pictures && pictures.map((picture, index) => (
            <div className="position-relative p-0 mx-2" key={index} style={{ width: width, height: height }}>
              <Actions index={index} iconSize={iconSize} remove={remove} cropPicture={cropPicture} crop={crop} />
              <ImageDisplay picture={picture} height={height} width={width} className="mb-4" />
            </div>
          ))
        }
      </div>
    );
  }, [pictures]);


  const cropPicture = (index) => {
    let picture = pictures.find((_, i) => i === index);
    setSrcCrop(picture)
    setOpenCrop(true)
    setIndexCrop(index)
  }

  const saveCroppedPicture = (picture) => {
    setPictures(items => items.map((item, i) =>
      i === indexCrop
        ? picture
        : item
    ));
    setSrcCrop(false)
    setOpenCrop(false)
    setIndexCrop(false)
    let listerrors = errors;
    listerrors = listerrors.filter(err => err.filename !== picture.name)
    setErrors(listerrors);
  }

  const sendPictures = () => {
    let uploadPicturesPromise = new Promise(resolve => { resolve(savePictures(pictures)) });
    uploadPicturesPromise.then(uploadPicturesResult => {
      setPictures([]);
    });
  }

  return (
    <div ref={ref}>
      {
        crop && <Crop picture={srcCrop} isOpen={openCrop} setOpenCrop={setOpenCrop} saveCroppedPicture={saveCroppedPicture} iconSize={iconSize} aspect={aspect} />
      }

      {
        <div className={classStyle}>
          <div className="upload-content">
            {title !== null ?
                <div className="upload-header">
                  <h1 className="upload-title fs-5">{title}</h1>
                </div>
            : ""}
            <div className="mb-5 upload-body">
              {
                errors.length > 0 && (
                  <div>
                    {
                      errors.map((error, key) => (
                        <div className="alert alert-warning" key={key} role="alert">
                          {error.filename} : {errorsMessages[error.type]}
                        </div>
                      ))
                    }
                  </div>
                )
              }
              {
                drag && pictures.length === 0 && instructions &&
                <div className="mb-2">
                  <div className="alert alert-info" role="alert" dangerouslySetInnerHTML={{__html: instructions}}>
                  </div>
                </div>
              }
              <div className="row justify-content-center mb-2">
                <div className="mb-3" style={{ width: "auto" }}>
                  <input onChange={onFileChange} className="form-control" type="file" id="formFile" multiple={true} />
                </div>
              </div>
              {
                drag && pictures.length > 1 &&
                <div className="mb-2">
                  <div className="alert alert-info" role="alert">
                    You can drag the pictures to rearrange their order.
                  </div>
                </div>
              }
              <div className="row d-flex justify-content-center">
                {
                  drag && pictures.length > 0 ? (
                    <DraggableRender />
                  ) : (
                    <ImagesRender />
                  )
                }
              </div>
            </div>

          </div>
          {
            crop && <div className={(openCrop ? "modal-backdrop fade show" : "")}></div>
          }
        </div>
      }
    </div>
  )
})


function ImageDisplay({ picture, width, height }) {
  return <img src={picture.src} style={{
    height: height,
    width: width,
  }} className="mb-4" />
}


function Actions({
  index,
  iconSize,
  remove,
  cropPicture,
  crop
}) {
  return (
    <div className="d-flex w-100 justify-content-between p-0 pb-3" >
      {
        crop && <FontAwesomeIcon role="button" onClick={() => cropPicture(index)} icon={faCropSimple} size={iconSize} />
      }
      <FontAwesomeIcon role="button" onClick={() => remove(index)} icon={faXmark} size={iconSize} />
    </div>
  )
}
export default UploadPictures;