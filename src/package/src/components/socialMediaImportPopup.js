import React, {useCallback, useState, forwardRef, useImperativeHandle, useEffect} from "react"

import "../assets/style/index.scss"
import { LazyLoadImage } from "react-lazy-load-image-component";


const ERROR = {
  NOT_SUPPORTED_EXTENSION: 'NOT_SUPPORTED_EXTENSION',
  FILE_SIZE_TOO_LARGE: 'FILE_SIZE_TOO_LARGE',
  DIMENSION_IMAGE: "DIMENSION_IMAGE"
}

const LoadingIndicator = () => (
    <div className="d-flex justify-content-center mt-3">
      <div className="spinner-border" role="status">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
)

const SocialMediaImportPopup = forwardRef((
  {
    title = null,
    height = "200px",
    width = "200px",
    classStyle = "",
    iconSize = "lg",
    handleClose = () => { },
    setPhotosCallback = () => { },
    token = '',

  },
  ref
) => {
  useImperativeHandle(ref, () => ({
    getErrors() {
      return [];
    },
    getPictures() {
      return pictures;
    },
  }));
  const [pictures, setPictures] = useState([]);
  const [selected, setSelected] = useState([]);

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    FBGetPhotos();
  }, [])

  async function fetchIpi(path, accessToken) {
      const response = await fetch(`https://graph.facebook.com/${path}&access_token=${token}`);
      return await response.json();
  }

  const getAlbums = useCallback(async () => {
      const response = await fetchIpi('me/albums?fields=id,name', token)
      if(response.data && response.data.length > 0) {
          await response.data.map(async album => {
              if(album.name === "Profile pictures") {
                let data = await getPhotosForAlbumId(album.id)
                let results = []
                let dimensionErrors = [];
                results = data.map((item, index) =>({src: item.source}));
                if (results) {
                  setPictures([...pictures, ...results]);
                }
              }
          })
      }
      setLoading(false);
  }, [[...pictures]])

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

  const toggleMarkSelected = useCallback((pos) => {
      let result;

      if (selected.includes(pos)) {
          result = selected.filter(el => el !== pos);
          setSelected(result);
          setPhotosCallback(pictures, result);
      } else {
          result = [...selected, pos];
          setSelected(result);
          setPhotosCallback(pictures, result);
      }
  }, [pictures, selected])

  return (
    <>
      <div ref={ref} style={{minHeight: 480, maxHeight: 800, overflowY: "auto"}}>
        {
          <div className={classStyle}>
            <div className="upload-content">
              {title !== null ?
                <div className="upload-header">
                  <h1 className="upload-title fs-5">{title}</h1>
                </div>
              : ""}
              {!!selected?.length &&
                  <div className="mb-2">
                    <div className="alert alert-info" role="alert">
                        {`(${selected?.length}) pictures selected`}
                    </div>
                  </div>
              }
              <div className="mb-5 upload-body">
                <div className="row justify-content-center mb-5">
                  <div className="col" style={{width: "auto"}}>
                  </div>
                </div>
                {
                      loading && <LoadingIndicator />
                }
                <div className="row d-flex justify-content-center space-photos">
                  {
                      pictures.length > 0 && (
                        <div className="row d-flex justify-content-center">
                        {
                          pictures.map((picture, index) => (
                            <div 
                             className={`position-relative p-0 mx-2 mb-4 social-media ${selected.includes(index) ? 'selected' : ''}`} 
                             key={index} style={{ width: width, height: height }} 
                             onClick={() => toggleMarkSelected(index)}
                            >
                              <ImageDisplay picture={picture} height={height} width={width} className="mb-4" />
                            </div>
                          ))
                        }
                        {
                          pictures.map((picture, index) => (
                            <div 
                             className={`position-relative p-0 mx-2 mb-4 social-media ${selected.includes(index) ? 'selected' : ''}`} 
                             key={index} style={{ width: width, height: height }} 
                             onClick={() => toggleMarkSelected(index)}
                            >
                              <ImageDisplay picture={picture} height={height} width={width} className="mb-4" />
                            </div>
                          ))
                        }
                        {
                          pictures.map((picture, index) => (
                            <div 
                             className={`position-relative p-0 mx-2 mb-4 social-media ${selected.includes(index) ? 'selected' : ''}`} 
                             key={index} style={{ width: width, height: height }} 
                             onClick={() => toggleMarkSelected(index)}
                            >
                              <ImageDisplay picture={picture} height={height} width={width} className="mb-4" />
                            </div>
                          ))
                        }
                        {
                          pictures.map((picture, index) => (
                            <div 
                             className={`position-relative p-0 mx-2 mb-4 social-media ${selected.includes(index) ? 'selected' : ''}`} 
                             key={index} style={{ width: width, height: height }} 
                             onClick={() => toggleMarkSelected(index)}
                            >
                              <ImageDisplay picture={picture} height={height} width={width} className="mb-4" />
                            </div>
                          ))
                        }
                      </div>
                    )
                  }
                </div>
              </div>

            </div>
          </div>
        }
      </div>
    </>
  )
})

function ImageDisplay({ picture, width, height }) {
  return <LazyLoadImage src={picture.src} style={{
    height: height,
    width: width,
  }} alt="Social media picture" effect="opacity" width={width} height={height} placeholder={<LoadingIndicator />} />
}

export default SocialMediaImportPopup;
