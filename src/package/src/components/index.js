import React, {useCallback, useState, forwardRef, useImperativeHandle, useEffect} from "react"

import "../assets/style/index.scss"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCropSimple, faXmark, faFileImport } from "@fortawesome/free-solid-svg-icons";
import { faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons';
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
    openedSocialOverride = false,
  },
  ref
) => {
  useImperativeHandle(ref, () => ({
    getErrors() {
      return {
        NOT_SUPPORTED_EXTENSION: pictures.map(el => el.NOT_SUPPORTED_EXTENSION),
        FILE_SIZE_TOO_LARGE: pictures.map(el => el.FILE_SIZE_TOO_LARGE),
        DIMENSION_IMAGE: pictures.map(el => el.DIMENSION_IMAGE),
      };
    },
    getPictures() {
      return pictures.map(el => el.contents?.file);
    },
  }));
  const [pictures, setPictures] = useState([]);
  const [socialRawMediaPictures, setSocialMediaRawPictures] = useState([]);
  const [socialMediaSelectedPictures, setSocialMediaSelectedPictures] = useState([]);

  const [srcCrop, setSrcCrop] = useState(false)
  const [openCrop, setOpenCrop] = useState(false)
  const [indexCrop, setIndexCrop] = useState(false)
  const [openedSocial, setOpenedSocial] = useState(openedSocialOverride);

  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if(setPhotosCallback) {
      setPhotosCallback(pictures)
    }
  }, [pictures?.length]);

  useEffect(() => {
    if (window.location.search.includes("?code")) {
      setOpenedSocial('instagram');
    }
  }, [])

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
    // Clear prev error files
    setPictures(pictures => pictures.filter(e => !!e?.contents));

    let allFilePromises = [];
    if (event.target.files) {
      Array.from(event.target.files).forEach((file) => {
        const errors = {
          NOT_SUPPORTED_EXTENSION: false,
          FILE_SIZE_TOO_LARGE: false,
          DIMENSION_IMAGE: false,
        };

        if (!hasExtension(file.name)) {
          errors.NOT_SUPPORTED_EXTENSION = {type: ERROR.NOT_SUPPORTED_EXTENSION, filename: file.name};
        }

        if (file.size > maxFileSize) {
          errors.FILE_SIZE_TOO_LARGE = {type: ERROR.FILE_SIZE_TOO_LARGE, filename: file.name};
        }

        const newFile = new Promise(async (resolve) => resolve({
          ...errors,
          contents: !errors.FILE_SIZE_TOO_LARGE && !errors.NOT_SUPPORTED_EXTENSION ? await readFile(file) : null ,
        }));

        allFilePromises.push(newFile);
      })

      Promise.all(allFilePromises).then(newFilesData => {
        newFilesData.forEach((newFileData, index) => {
          if (!newFileData.contents) {
            setPictures(pictures => [...pictures, newFileData] );
            return;
          }
          
          newFileData.contents.file.src = newFileData.contents.dataURL
          var image = new Image();
          image.src = newFileData.contents.file.src;
          image.index = index;
          image.addEventListener('load', () => {
            const { width, height } = image;
            // check aspect ratio of the image
            if (aspect !== (width / height)) {
              newFileData.contents.file.needsCropping = true;
              newFileData.DIMENSION_IMAGE = {
                  index: index + pictures?.length,
                  type: ERROR.DIMENSION_IMAGE,
                  filename: newFileData.contents.file.name
              }
            }
            setPictures(pictures => [...pictures, newFileData] );
          });
        });
      });
    }
  }, [pictures?.length, aspect, hasExtension, maxFileSize]);

  const remove = (index) => {
    let newList = pictures.filter((_, i) => i !== index);
    setPictures(newList);
  }

  const getChangedPos = (currentPos, newPos) => {
    let newList = [...pictures];
    let pic = newList.splice(currentPos, 1);
    newList.splice(newPos, 0, pic[0]);

    setPictures(newList);
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
    const results = await Promise.all(selectedPictures.map(async (item, index) => {
      const src = await imageUrlToBase64(item?.src);
      let needsCropping = false;
      let dimensionError = false;

      if (aspect !== (width / height)) {
        dimensionError = {
            index: index + pictures?.length,
            type: ERROR.DIMENSION_IMAGE,
            filename: ''
        }
        needsCropping = true;
      }

      return {
        contents: {
          file: {
            src: src,
            needsCropping: needsCropping,
          },
        }, 
        NOT_SUPPORTED_EXTENSION: false,
        FILE_SIZE_TOO_LARGE: false,
        DIMENSION_IMAGE: dimensionError,
      };
    }))
    if (results) {
      setPictures([...pictures, ...results]);
    }
    setOpenedSocial(false);
    setSocialMediaRawPictures([]);
    setSocialMediaSelectedPictures([]);
  }, [pictures, socialMediaSelectedPictures, socialRawMediaPictures]);


  const DraggableRender = useCallback(() => {
    return (
      <Draggable onPosChange={getChangedPos}>
        {
          pictures.length > 0 && pictures.map((picture, index) => {
            return (
                <div className={`${picture.contents?.file?.needsCropping ? "border border-warning" : ""} position-relative p-0 mx-2 drager-pictures`} key={index} style={{ width: width }}>
                  <Actions index={index} iconSize={iconSize} remove={remove} cropPicture={cropPicture} crop={crop} />
                  <ImageDisplay picture={picture.contents?.file} height={height} width={width} className="mb-4" />
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
              <ImageDisplay picture={picture.contents?.file} height={height} width={width} className="mb-4" />
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
    let newPicture = {...picture};

    newPicture.contents.file.needsCropping = false;
    newPicture.DIMENSION_IMAGE = false;

    setPictures(items => {
      const res = items.map((item, i) =>
        i === indexCrop
          ? newPicture
          : item
      );
      setPhotosCallback(res);
      return res;
    });
    setSrcCrop(false)
    setOpenCrop(false)
    setIndexCrop(false)
  }

  const tooLargeErrors = pictures.map(el => (el.FILE_SIZE_TOO_LARGE)).filter(e => !!e);
  const notSupportedErrors = pictures.map(el => (el.NOT_SUPPORTED_EXTENSION)).filter(e => !!e);
  const dimensionErrors = pictures.map((el, index) => (el.DIMENSION_IMAGE ? {...el.DIMENSION_IMAGE, index: index} : false)).filter(e => !!e);
  const shownPictures = pictures.filter(pic => !!pic?.contents);

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
                    tooLargeErrors?.length ? (
                      <div className="alert alert-danger" role="alert">
                        <strong>{errorMessages[ERROR.FILE_SIZE_TOO_LARGE]}</strong>
                        {tooLargeErrors.map((error) => error.filename).join(', ')}
                      </div>
                    ) : ""
                }
                {
                    notSupportedErrors?.length ? (
                      <div className="alert alert-danger" role="alert">
                        <strong>{errorMessages[ERROR.NOT_SUPPORTED_EXTENSION]}</strong>
                        {notSupportedErrors.map((error) => error.filename).join(', ')}
                      </div>
                    ) : ""
                }
                {
                    dimensionErrors?.length ? (
                      <div className="alert alert-warning" role="alert">
                        <strong>{errorMessages[ERROR.DIMENSION_IMAGE]}</strong>
                        {dimensionErrors.map((el) => '[' + el.index + ']').join(', ')}
                      </div>
                    ) : ""
                }
                {
                  drag && shownPictures.length === 0 && instructions &&
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
                    <button onClick={() => setOpenedSocial('facebook')} className="facebook-import-button"><FontAwesomeIcon icon={faFacebook} size={iconSize} className="facebook-import-button-icon"/></button>
                    <button onClick={() => setOpenedSocial('instagram')} className="instagram-import-button"><FontAwesomeIcon icon={faInstagram} size={iconSize} className="instagram-import-button-icon"/></button>
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
                    drag && shownPictures.length > 1 &&
                    <div className="mb-2">
                      <div className="alert alert-info" role="alert">
                      {dragDescription}
                      </div>
                    </div>
                }
                <div className="row d-flex justify-content-center space-photos">
                  {
                    drag && shownPictures.length > 0 && (
                      <DraggableRender />
                    )
                  }
                  {
                      !drag && shownPictures.length > 0 && (
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
                  <Modal.Title>{multiple ? "Select Images" : "Select an Image"}</Modal.Title>
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
                      multiple={multiple}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setOpenedSocial(false)}>
                        <FontAwesomeIcon icon={faXmark} size={iconSize}/>
                    </Button>
                    <Button variant="primary" className="text-white" onClick={saveSocialPictures} disabled={!socialMediaSelectedPictures?.length} data-bs-toggle="tooltip" data-bs-placement="top" title="Tooltip on top">
                        <FontAwesomeIcon icon={faFileImport} size={iconSize}/>
                    </Button>
                </Modal.Footer>
            </Modal>
      )}
    </>
  )
})


function ImageDisplay({ picture, width, height }) {
  return <img src={picture?.src} style={{
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