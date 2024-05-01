import React, {useCallback, useState, forwardRef, useImperativeHandle, useEffect} from "react"

import "../assets/style/index.scss"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCropSimple, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Button, Modal } from 'react-bootstrap';
import { Draggable } from "react-drag-reorder";

import Crop from "./crop";
import SocialMediaImportPopup from "./socialMediaImportPopup";

const ERROR = {
  NOT_SUPPORTED_EXTENSION: 'NOT_SUPPORTED_EXTENSION',
  FILE_SIZE_TOO_LARGE: 'FILE_SIZE_TOO_LARGE',
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
    multiple = true,
    aspect = 4 / 3,
    dragDescription = "You can drag pictures to rearrange their order",
    instructions = null,
    errorMessages = {
      NOT_SUPPORTED_EXTENSION: 'The following files are of unsupported types: ',
      FILE_SIZE_TOO_LARGE: 'The following files are too large and cannot be imported:',
      DIMENSION_IMAGE: "The following images need to be cropped: "
    },
    handleClose = () => { },
    setPhotosCallback = () => { },
    token = '',

  },
  ref
) => {
  useImperativeHandle(ref, () => ({
    getErrors() {
      return errors;
    },
    getPictures() {
      return pictures;
    },
  }));
  const [pictures, setPictures] = useState([]);
  const [socialRawMediaPictures, setSocialMediaRawPictures] = useState([]);
  const [socialMediaSelectedPictures, setSocialMediaSelectedPictures] = useState([]);

  const [errors, setErrors] = useState({NOT_SUPPORTED_EXTENSION: [], FILE_SIZE_TOO_LARGE: [], DIMENSION_IMAGE: []})
  const [srcCrop, setSrcCrop] = useState(false)
  const [openCrop, setOpenCrop] = useState(false)
  const [indexCrop, setIndexCrop] = useState(false)
  const [openedSocial, setOpenedSocial] = useState(false);

  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if(setPhotosCallback) {
      setPhotosCallback(pictures)
    }
  }, [pictures?.length]);
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

  const onFileChange = useCallback(event => {
    setErrors({NOT_SUPPORTED_EXTENSION: [], FILE_SIZE_TOO_LARGE: [], DIMENSION_IMAGE: []});
    let allFilePromises = []
    let notSupportedExtensionErrors = [], fileSizeTooLargeErrors = [], dimensionErrors = [];
    if (event.target.files) {
      Array.from(event.target.files).forEach((file) => {
        if (!hasExtension(file.name)) {
          notSupportedExtensionErrors.push({ type: ERROR.NOT_SUPPORTED_EXTENSION, filename: file.name });
        }

        if (file.size > maxFileSize) {
          fileSizeTooLargeErrors.push({type: ERROR.FILE_SIZE_TOO_LARGE, filename: file.name });
        }
        if (notSupportedExtensionErrors.length > 0 || fileSizeTooLargeErrors.length > 0) {
          setErrors({NOT_SUPPORTED_EXTENSION : notSupportedExtensionErrors, FILE_SIZE_TOO_LARGE : fileSizeTooLargeErrors});
          return false
        }
        allFilePromises.push(readFile(file));
      })
      if (notSupportedExtensionErrors.length === 0 && fileSizeTooLargeErrors.length === 0) {
        Promise.all(allFilePromises).then(newFilesData => {
          newFilesData.forEach((newFileData, index) => {
            newFileData.file.src = newFileData.dataURL
            var image = new Image();
            image.src = newFileData.file.src;
            image.index = index;
            image.addEventListener('load', () => {
              const { width, height } = image;
              // check aspect ratio of the image
              if (aspect !== (width / height)) {
                newFileData.file.needsCropping = true;
                dimensionErrors.push(
                  {
                    index: index + pictures?.length,
                    type: ERROR.DIMENSION_IMAGE,
                    filename: newFileData.file.name
                  }
                );
                setErrors({NOT_SUPPORTED_EXTENSION : notSupportedExtensionErrors, FILE_SIZE_TOO_LARGE : fileSizeTooLargeErrors, DIMENSION_IMAGE: [...errors.DIMENSION_IMAGE, ...dimensionErrors.sort(sortErrorsByIndex)]});
              }
              setPictures(pictures => [...pictures,newFileData.file] );
            });
          });
        });
      }
    }
  }, [pictures?.length, aspect, hasExtension, maxFileSize]);

  const remove = (index) => {
    let notSupportedExtensionErrors = errors.NOT_SUPPORTED_EXTENSION;
    let fileSizeTooLargeErrors = errors.FILE_SIZE_TOO_LARGE;
    let dimensionErrors = errors.DIMENSION_IMAGE;
    notSupportedExtensionErrors = notSupportedExtensionErrors.filter(err => err.filename !== pictures[index].name);
    fileSizeTooLargeErrors = fileSizeTooLargeErrors.filter(err => err.filename !== pictures[index].name);
    dimensionErrors = dimensionErrors.filter(err => err.index !== index).map((el, i) => ({...el, index: i >= index ? el.index - 1 : el.index}));

    setErrors({NOT_SUPPORTED_EXTENSION : notSupportedExtensionErrors, FILE_SIZE_TOO_LARGE : fileSizeTooLargeErrors, DIMENSION_IMAGE: dimensionErrors.sort(sortErrorsByIndex)});

    let newList = pictures.filter((_, i) => i !== index);
    setPictures(newList);
  }

  const getChangedPos = (currentPos, newPos) => {
    let newList = pictures
    let errorList = errors;
    let pic = newList.splice(currentPos, 1);
    newList.splice(newPos - 1, 0, pic[0]);

    let picError = errorList.DIMENSION_IMAGE.splice(currentPos, 1);
    errorList.DIMENSION_IMAGE.splice(newPos - 1, 0, picError[0]);
    errorList.DIMENSION_IMAGE[currentPos].index = currentPos;
    errorList.DIMENSION_IMAGE[newPos].index = newPos;
    setPictures(newList);
    setErrors(errorList);
  };

  const sortErrorsByIndex = (a, b) => {
    if (a.index > b.index) {
      return 1
    } else if (a.index < b.index) {
      return -1
    } else {
      return 0
    }
  };

  const imageUrlToBase64 = async (url) => {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result;
        resolve(base64data);
      };
      reader.onerror = reject;
    });
  };

  const setSocialMediaPhotosCallback = (socialPics, selected) => {
    setSocialMediaRawPictures(socialPics);
    setSocialMediaSelectedPictures(selected);
  }

  const saveSocialPictures = useCallback(async () => {
    const selectedPictures = socialRawMediaPictures.filter((_, index) => socialMediaSelectedPictures.includes(index));
    let dimensionErrors = [];
    const results = await Promise.all(selectedPictures.map(async (item, index) => {
      const src = await imageUrlToBase64(item.src);
      let needsCropping = false;

      if (aspect !== (width / height)) {
        dimensionErrors.push(
          {
            index: index + pictures?.length,
            type: ERROR.DIMENSION_IMAGE,
            filename: ''
          }
        );
        needsCropping = true;
      }

      return {src: src, needsCropping: needsCropping};
    }))
    if (results) {
      setPictures([...pictures, ...results]);
    }
    setErrors({NOT_SUPPORTED_EXTENSION : errors.NOT_SUPPORTED_EXTENSION, FILE_SIZE_TOO_LARGE : errors.FILE_SIZE_TOO_LARGE, DIMENSION_IMAGE: [...errors.DIMENSION_IMAGE, ...dimensionErrors.sort(sortErrorsByIndex)]});
    setOpenedSocial(false);
    setSocialMediaRawPictures([]);
    setSocialMediaSelectedPictures([]);
  }, [pictures, socialMediaSelectedPictures, socialRawMediaPictures, errors]);


  const DraggableRender = useCallback(() => {
    return (
      <Draggable onPosChange={getChangedPos}>
        {
          pictures.length > 0 && pictures.map((picture, index) => {
            return (
                <div className={`${picture.needsCropping ? "border border-warning" : ""} position-relative p-0 mx-2 drager-pictures`} key={index} style={{ width: width }}>
                  <Actions index={index} iconSize={iconSize} remove={remove} cropPicture={cropPicture} crop={crop} />
                  <ImageDisplay picture={picture} height={height} width={width} className="mb-4" />
                </div>
            )
            })
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
    picture.needsCropping = false;
    let listErrors = errors.DIMENSION_IMAGE;

    listErrors = listErrors.filter(err => err.index !== indexCrop)
    setErrors({NOT_SUPPORTED_EXTENSION : errors.NOT_SUPPORTED_EXTENSION, FILE_SIZE_TOO_LARGE : errors.FILE_SIZE_TOO_LARGE, DIMENSION_IMAGE : listErrors});
  }

  return (
    <>
      {
        crop && <Crop picture={srcCrop} isOpen={openCrop} setOpenCrop={setOpenCrop} saveCroppedPicture={saveCroppedPicture} iconSize={iconSize} aspect={aspect} />
      }
      <div ref={ref}>
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
                    errors.FILE_SIZE_TOO_LARGE && errors.FILE_SIZE_TOO_LARGE.length > 0 ?
                      <div className="alert alert-danger" role="alert">
                        <strong>{errorMessages[ERROR.FILE_SIZE_TOO_LARGE]}</strong> {errors.FILE_SIZE_TOO_LARGE.map((error) => error.filename).join(', ')}
                      </div>
                    :""
                }
                {
                    errors.NOT_SUPPORTED_EXTENSION && errors.NOT_SUPPORTED_EXTENSION.length > 0 ?
                      <div className="alert alert-danger" role="alert">
                        <strong>{errorMessages[ERROR.NOT_SUPPORTED_EXTENSION]}</strong> {errors.NOT_SUPPORTED_EXTENSION.map((error) => error.filename).join(', ')}
                      </div>
                    :""
                }
                {
                    errors.DIMENSION_IMAGE && errors.DIMENSION_IMAGE.length > 0 ?
                      <div className="alert alert-warning" role="alert">
                        <strong>{errorMessages[ERROR.DIMENSION_IMAGE]}</strong> {errors.DIMENSION_IMAGE.map((error) => '[' + error.index + ']').join(', ')}
                      </div>
                    :""
                }
                {
                  drag && pictures.length === 0 && instructions &&
                  <div className="mb-2">
                    <div className="alert alert-info" role="alert" dangerouslySetInnerHTML={{ __html: instructions }}>
                    </div>
                  </div>
                }
                <div className="row justify-content-center mb-5">
                  <div className="col" style={{width: "auto"}}>
                    <input onChange={onFileChange} className="form-control" type="file" id="formFile" multiple={multiple}/>
                  </div>
                  <div className="col social-buttons">
                    <button onClick={() => setOpenedSocial('facebook')} className="facebook-import-button">Import from Facebook</button>
                    <button onClick={() => setOpenedSocial('instagram')} className="instagram-import-button">Import from Instagram</button>
                  </div>
                </div>
                {
                      loading && (
                            <div className="d-flex justify-content-center mt-3">
                              <div className="spinner-border" role="status">
                                <span className="sr-only">Loading...</span>
                              </div>
                            </div>
                      )
                }
                {
                    drag && pictures.length > 1 &&
                    <div className="mb-2">
                      <div className="alert alert-info" role="alert">
                      {dragDescription}
                      </div>
                    </div>
                }
                <div className="row d-flex justify-content-center space-photos">
                  {
                    drag && pictures.length > 0 && (
                      <DraggableRender />
                    )
                  }
                  {
                      !drag && pictures.length > 0 && (
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
      {!!openedSocial && (
             <Modal
                show={!!openedSocial}
                onHide={()=>setOpenedSocial(false)}
                size="xl"
                keyboard={true}>
                <Modal.Header closeButton>
                  <Modal.Title>Select Images</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                <SocialMediaImportPopup
                      ref={ref}
                      modalSource={openedSocial}
                      height="100px"
                      width="100px"
                      iconSize="lg"
                      handleClose= { () => setOpenedSocial(false)}
                      setPhotosCallback={setSocialMediaPhotosCallback}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setOpenedSocial(false)}>
                        Close
                    </Button>
                    <Button variant="primary" className="text-white" onClick={saveSocialPictures} disabled={!socialMediaSelectedPictures?.length} data-bs-toggle="tooltip" data-bs-placement="top" title="Tooltip on top">
                        Save
                    </Button>
                </Modal.Footer>
            </Modal>
      )}
    </>
  )
})


function ImageDisplay({ picture, width, height }) {
  return <img src={picture.src} style={{
    height: height,
    width: width,
  }} className="mb-4" alt=""/>
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
        crop && <FontAwesomeIcon role="button" onClick={() => cropPicture(index)} icon={faCropSimple} size={iconSize} className="my-auto" />
      }
      <b className="fs-5 my-auto">[{index}]</b>
      <FontAwesomeIcon role="button" onClick={() => remove(index)} icon={faXmark} size={iconSize} className="my-auto" />
    </div>
  )
}
export default UploadPictures;