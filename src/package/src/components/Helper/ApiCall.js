import axios from 'axios';
import qs from 'qs';

const instance = axios.create();

let baseUrl = null;
export default class ApiCall {

  static get(url, queryParams, contentType, data, headers) {
    return this.requestHelper(url, 'GET', data, queryParams, contentType, headers);
  }

  static post(url, data, contentType, queryParams) {
    return this.requestHelper(url, 'POST', data, queryParams , contentType);
  }

  static put(url, data, queryParams, contentType, headers) {
    return this.requestHelper(url, 'PUT', data, queryParams, contentType, headers);
  }

  static delete(url, queryParams, data) {
    return this.requestHelper(url, 'DELETE', data, queryParams, null);
  }

  static patch(url, data, contentType) {
    return this.requestHelper(url, 'PATCH', data, null, contentType);
  }

  static getCsrfToken() {
    return instance({
      url: this.parseTemplatedUrl('/csrf'),
      method: 'GET',
      baseURL: this.getRestUrl()
    });
  }

  static requestHelper(url, method, data, params, contentType, headers) {
    let parsedUrl = this.parseTemplatedUrl(url);
    return instance({
      url: parsedUrl,
      method: method,
      baseURL: this.getRestUrl(),
      headers: this.getHeaders(contentType, headers),
      data: data,
      params: params,
      paramsSerializer: function(params) {
        return qs.stringify(params, {arrayFormat: 'repeat'})
      }
    }).catch(error => {
      if(!parsedUrl.includes('auth') && (error?.response?.status === 401 || error?.response?.status === 403)) {
        localStorage.clear();
        window.location.reload("/login");
      } else {
        throw error;
      }
    })
  }

  static getRestUrl() {
    if (!baseUrl) {
      baseUrl = process.env.REACT_APP_FACADE_URL;
    }

    return baseUrl;
  }

  static getHeaders(contentType, headers) {
    let result = {};

    if (headers) {
      result = headers;
    }
    result['Content-Type'] = contentType || 'application/json';

    let nemesisToken = localStorage.getItem("token");
    if (nemesisToken) {
      result['X-Nemesis-Token'] = nemesisToken;
    }

    return result;
  }

  static parseTemplatedUrl(url) {
    return url.replace(new RegExp('({.*})', 'g'), '');
  }
}
