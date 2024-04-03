import React, {useCallback, useState, forwardRef, useImperativeHandle, useEffect} from "react"

import "../assets/style/index.scss"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCropSimple, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Draggable } from "react-drag-reorder";

import Crop from "./crop";

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
  const [pictures, setPictures] = useState([])

  const [errors, setErrors] = useState({NOT_SUPPORTED_EXTENSION: [], FILE_SIZE_TOO_LARGE: [], DIMENSION_IMAGE: []})
  const [srcCrop, setSrcCrop] = useState(false)
  const [openCrop, setOpenCrop] = useState(false)
  const [indexCrop, setIndexCrop] = useState(false)

  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if(setPhotosCallback) {
      setPhotosCallback(pictures)
    }
  }, [pictures]);
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
            let idx = pictures.length;
            image.src = newFileData.file.src;
            image.index = idx;
            image.addEventListener('load', () => {
              const { width, height } = image;
              // check aspect ratio of the image
              if (aspect !== (width / height)) {
                newFileData.file.needsCropping = true;
                dimensionErrors.push(
                  {
                    index: idx,
                    type: ERROR.DIMENSION_IMAGE,
                    filename: newFileData.file.name
                  }
                );
                setErrors({NOT_SUPPORTED_EXTENSION : notSupportedExtensionErrors, FILE_SIZE_TOO_LARGE : fileSizeTooLargeErrors, DIMENSION_IMAGE: dimensionErrors});
              }
              setPictures(pictures => [...pictures,newFileData.file] );
            });
          });
        });
      }
    }
  };

  const remove = (index) => {
    let notSupportedExtensionErrors = errors.NOT_SUPPORTED_EXTENSION;
    let fileSizeTooLargeErrors = errors.FILE_SIZE_TOO_LARGE;
    let dimensionErrors = errors.DIMENSION_IMAGE;
    notSupportedExtensionErrors = notSupportedExtensionErrors.filter(err => err.filename !== pictures[index].name);
    fileSizeTooLargeErrors = fileSizeTooLargeErrors.filter(err => err.filename !== pictures[index].name);
    dimensionErrors = dimensionErrors.filter(err => err.filename !== pictures[index].name);

    setErrors({NOT_SUPPORTED_EXTENSION : notSupportedExtensionErrors, FILE_SIZE_TOO_LARGE : fileSizeTooLargeErrors, DIMENSION_IMAGE: dimensionErrors});

    let newList = pictures.filter((_, i) => i !== index);
    setPictures(newList);
  }

  const getChangedPos = (currentPos, newPos) => {
    let newList = pictures
    let pic = newList.splice(currentPos, 1);
    newList.splice(newPos - 1, 0, pic[0]);
    setPictures(newList)
  };

  async function fetchIpi(path, accessToken) {
      const response = await fetch(`https://graph.facebook.com/${path}&access_token=${token}`);
      return await response.json();
  }

  async function getAlbums() {
      const response = await fetchIpi('me/albums?fields=id,name', token)
      if(response.data && response.data.length > 0) {
          await response.data.map(async album => {
              if(album.name === "Profile pictures") {
                let data = await getPhotosForAlbumId(album.id)
                let results = []
                let dimensionErrors = [];
                data.map(async (item, index) => {
                  const src = await imageUrlToBase64(item.source);
                  let needsCropping = false;

                  if (aspect !== (width / height)) {
                    dimensionErrors.push(
                      {
                        index: index,
                        type: ERROR.DIMENSION_IMAGE,
                        filename: ''
                      }
                    );
                    needsCropping = true;
                  }

                  results.push({src: src, needsCropping: needsCropping})
                  setPictures([...pictures, ...results])
                })
                setErrors({NOT_SUPPORTED_EXTENSION : errors.NOT_SUPPORTED_EXTENSION, FILE_SIZE_TOO_LARGE : errors.FILE_SIZE_TOO_LARGE, DIMENSION_IMAGE: dimensionErrors});
              }
          })
      }
      setLoading(false);
  }

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

  async function getPhotosForAlbumId(albumId) {
      const response = await fetchIpi(`${albumId}/photos?fields=source`)
      return await response.data && response.data.length > 0 ? response.data : []
  }

  async function FBGetPhotos() {
    setLoading(true)
    if (token) {
        await getAlbums()
    } else {
      setLoading(false)
    }
  }

  async function InstagramGetPhotos() {
    setLoading(true)
    if (token) {
        await getAlbums()
    } else {
      setLoading(false)
    }
  }


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

    listErrors = listErrors.filter(err => err.filename !== picture.name)
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
                    <button onClick={() => FBGetPhotos()} className="facebook-import-button">Import from Facebook</button>
                    <button onClick={() => InstagramGetPhotos()} className="instagram-import-button">Import from Instagram</button>
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