import React, { Component } from 'react';
import axios from 'axios';
import {generateUrlEncoded,getStorage,deleteStorage} from '../lib/utils'
import { Redirect, Link } from 'react-router-dom';
import 'react-rangeslider/lib/index.css'
import Slider from 'react-rangeslider'

class Profilepage extends Component {

  constructor(props) {
    super(props);

    this.state = {
      "alertMessage": "",
      "isLoaded": false,
      "sliderValue": 1,
      "actualMode": "",
      "isRunning": false,
      "isTuning": false,
      "redirectToLogin": false,
      "saving": false,
      "formChanged": false
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentWillUnmount() {
    if (typeof this.timeOutStatus !== 'undefined')
      clearTimeout(this.timeOutStatus);

  }

  componentDidMount() {
    this.checkStatus();
  }

  checkStatus() {
    var page=this;
    var token=getStorage("jwt");
    if (token===null) {
      this.setState({"redirectToLogin":true});
    } else {
        var postData = {

        };
        let axiosConfig = {
          headers: {
              'Authorization': 'Bearer ' + token
          }
        };
        axios.post(window.customVars.urlPrefix+window.customVars.apiGetAutoTuneStatus,postData,axiosConfig)
        .then(res => {
          if (res.data.success === true) {
            if (this.state.actualMode==="") {
              var sliderValue;
              switch (res.data.mode) {
                case "efficient":
                  sliderValue=1;
                  break;
                case "balanced":
                  sliderValue=2;
                  break;
                case "factory":
                  sliderValue=3;
                  break;
                case "performance":
                  sliderValue=4;
                  break;
                default:
              }
              page.setState({"isLoaded":true,"actualMode":res.data.mode,"sliderValue":sliderValue,"sliderValueSetted":sliderValue,"isRunning":res.data.isRunning,"isTuning":res.data.isTuning});
            } else {
              page.setState({"actualMode":res.data.mode,"isRunning":res.data.isRunning,"isTuning":res.data.isTuning});
            }
            page.timeOutStatus=setTimeout(() => {
              page.checkStatus();
            }, 20000);
          } else {
            if ((typeof res.data.token !== 'undefined')&&res.data.token!==null&&res.data.token==="expired") {
                deleteStorage("jwt");
                page.setState({"redirectToLogin":true});
            }
          }

          })
          .catch(function (error) {

          });
    }
  }


  handleSubmit(event) {
    var { sliderValue } = this.state;
    event.preventDefault();
    var token=getStorage("jwt");
    var page=this;
    if (token===null) {
      this.setState({"redirectToLogin":true});
    } else {

      var mode="";
      switch (sliderValue) {
        case 1:
          mode="efficient";
          break;
        case 2:
          mode="balanced"
          break;
        case 3:
          mode="factory";
          break;
        case 4:
          mode="performance"
          break;
        default:
      }

      var params = new URLSearchParams();
      params.append('autotune', mode);
      let axiosConfig = {
        headers: {
            'Authorization': 'Bearer ' + token
        }
      };
      this.setState({"saving":true});
      axios.post(window.customVars.urlPrefix+window.customVars.apiSetAutoTune,params,axiosConfig)
      .then(res => {
        if (res.data.success === true) {
          this.setState({"saving":false,"saved":true,"sliderValueSetted":sliderValue,"formChanged":false,"actualMode":mode,"isRunning":true,"isTuning":true});
        } else {
          if ((typeof res.data.token !== 'undefined')&&res.data.token!==null&&res.data.token==="expired") {
              deleteStorage("jwt");
              page.setState({"redirectToLogin":true});
          }

        }

        })
        .catch(function (error) {

        });
    }
  }


  handleChange = (value) => {
    this.setState({
      sliderValue: value,
      formChanged: (value!=this.state.sliderValueSetted)
    })
  }

  render() {
    var { alertMessage,isLoaded,sliderValue,redirectToLogin,saving,formChanged,saved,actualMode,isRunning,isTuning } = this.state;




    if (redirectToLogin) {
      return <Redirect to="/login?expired" />;
    }

    const horizontalLabels = {
      1: 'Efficiency',
      2: 'Balanced',
      3: 'Factory',
      4: 'Performance'
    }

    return (
      <div className="Profilepage">

      <h1>Miner Profile<br/><small>Performance</small></h1>


      <div className="row">

          {/* Box */}
         <div className="col-md-12 mt-5">
           <div className="box">
             <div className="box-header">
               <h3>Profiles {!isLoaded && <div className="lds-dual-ring pull-right"></div>}</h3>
             </div>


                 <div className="box-body p-4">
                 {saved &&
                     <div className="alert alert-success">
                       Profile configuration updated.
                     </div>
                 }

                   <div className="row">
                      <div className="col-md-12">
                        <p className="small">There are 4 tuning modes</p>
                        <ol className="small">
                          <li><strong>Efficiency</strong> the miner will use less power but the hash rate will be lower</li>
                          <li><strong>Balanced</strong> <i>recommended</i> value to achieve balanced hash rate and power consumption</li>
                          <li><strong>Factory</strong> the miner will work factory values</li>
                          <li><strong>Performance</strong> high hash rate and high power consumption</li>
                        </ol>
                        <p className="small">Tuning takes about 30 minutes and the result will be saved and used for again at reboot.</p>
                        <p className="small">Please note hashrate will vary during the tuning process.</p>


                        <Slider
                          min={1}
                          max={4}
                          value={0}
                          tooltip={false}
                          value={sliderValue}
                          onChange={this.handleChange}
                          labels={horizontalLabels}
                          className="mr-5 ml-5"
                        />
                        <br />
                        <h5 className="color-title mt-5">Tuning Status</h5>

                        <div className="row mt-3 text-left">
                            <div className="col-md-3">
                                <span className="field-title">Current Mode</span>
                            </div>
                            <div className="col-md-9 field-value">
                                {actualMode}
                            </div>
                        </div>
                        <div className="row mt-3 text-left">
                            <div className="col-md-3">
                                <span className="field-title">Tuning Status</span>
                            </div>
                            <div className="col-md-9 field-value">
                                {(isRunning===false||isTuning===true) && <div>tuning <div className="small lds-dual-ring"></div></div>}
                                {isRunning&&!isTuning && "tuned"}
                            </div>
                        </div>

                      </div>
                    </div>


                 </div>
                 <div className="box-footer">
                      <button disabled={!formChanged||saving} className="btn btn-primary" onClick={this.handleSubmit}>Save {saving && <div className="btn-loader lds-dual-ring"></div>}</button>
                 </div>
           </div>
         </div>
         {/* .Box */}


      </div>
      {/* ./row */}

      </div>
    );
  }
}

export default Profilepage;
