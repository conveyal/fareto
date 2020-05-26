import React from 'react'
import ODMap from './ODMap'
import {timeToSeconds, secondsToTime} from './timeutil'

export default class ProfileRequestUI extends React.Component {
    constructor (props) {
        super(props)

        // not the best place to store all the defaults
        this.state = {
            profileRequest : {
                "fromLat": 40.768540,
                "fromLon": -73.527855,
                "toLat": 40.712302,
                "toLon": -73.623859,
                "fromTime": 25200,
                "toTime": 25260,
                "walkSpeed": 1.3888888,
                "bikeSpeed": 4.1666665,
                "bikeTrafficStress": 4,
                "carSpeed": 20,
                "streetTime": 90,
                "maxWalkTime": 20,
                "maxBikeTime": 20,
                "maxCarTime": 45,
                "minBikeTime": 10,
                "minCarTime": 10,
                "date": "2019-12-16",
                "limit": 0,
                "accessModes": "WALK",
                "egressModes": "WALK",
                "directModes": "WALK",
                "transitModes": "TRAM,SUBWAY,RAIL,BUS,FERRY,CABLE_CAR,GONDOLA,FUNICULAR",
                "suboptimalMinutes": 5,
                "maxTripDurationMinutes": 240,
                "maxRides": 4,
                "inRoutingFareCalculator": {"type": "nyc"},
                "monteCarloDraws": 1,
                "maxFare": 200000
            }
        }
    }

    // hacky way to handle history/deep linking but it works
    componentDidMount () {
        if (window.location.search) {
            const params = new URLSearchParams(window.location.search)
            const load = params.get('load')
            if (load !== undefined) {
                // Load a pre-rendered route, saved as JSON on the server
                // for safety, make sure there are no slashes, etc. in the url
                // in case this is ever deployed on an authenticated site, someone might be able to do something
                // nasty by forcing requests to their domain with a malicious URL (I don't think they could, but maybe)
                if (/^[a-zA-Z0-9-_]+$/.test(load)) {
                    fetch(`results/${load}.json`)
                    .then(async (res) => {
                        if (res.ok) {
                            const json = await res.json()
                            this.props.setError(null)
                            this.props.setResults(json)

                            // need also to update parameters
                            this.setRequestFields({
                                fromLat: json.request.fromLat,
                                fromLon: json.request.fromLon,
                                toLat: json.request.toLat,
                                toLon: json.request.toLon,
                                inRoutingFareCalculator: { type: json.request.fareCalculatorType },
                                fromTime: json.request.fromTime,
                                toTime: json.request.toTime + 60,
                                date: json.request.date  
                            })
                        } else {
                            this.props.setError(await res.text())
                            this.props.setResults(null)
                        }
                    })
                } else {
                    this.props.setError('Invalid character in result name!')
                }
            }
        } else if (window.location.hash) {
            const hashState = JSON.parse(decodeURIComponent(window.location.hash.slice(1)))

            // enforce formatting of strings
            if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(hashState.date)) {
                this.props.setError('invalid date format, should be YYYY-MM-DD')
            } else if (!/^[a-zA-Z]+$/.test(hashState.fareCalculatorType)) {
                this.props.setError('invalid fare calculator type') 
            } else {
                // Make a new request
                this.setRequestFields({
                    fromLat: Number(hashState.fromLat),
                    fromLon: Number(hashState.fromLon),
                    toLat: Number(hashState.toLat),
                    toLon: Number(hashState.toLon),
                    inRoutingFareCalculator: { type: hashState.fareCalculatorType },
                    fromTime: Number(hashState.time),
                    toTime: Number(hashState.time + 60),
                    date: hashState.date
                })
            }
        }
    }

    setRequestFields = (fields) => {
        this.setState({ profileRequest: Object.assign({}, this.state.profileRequest, fields)})
    }

    // setToTime = (e) => {
    //     this.setRequestFields({toTime: timeToSeconds(e.target.value)})
    // }

    setFromTime = (e) => {
        this.setRequestFields({
            fromTime: timeToSeconds(e.target.value),
            toTime: timeToSeconds(e.target.value) + 60
        })
    }

    setDate = (e) => {
        this.setRequestFields({date: e.target.value})
    }

    setFareCalculatorType = (e) => {
        this.setRequestFields({
            inRoutingFareCalculator: Object.assign({}, this.state.inRoutingFareCalculator, {type: e.target.value})
        })
    }

    handleSubmit = (e) => {
        e.preventDefault() // prevent reload

        // update hash only on submit
        // hacky way to handle hash
        // TODO persist map state
        const hashState = {
            fromLat: this.state.profileRequest.fromLat,
            fromLon: this.state.profileRequest.fromLon,
            toLat: this.state.profileRequest.toLat,
            toLon: this.state.profileRequest.toLon,
            fareCalculatorType: this.state.profileRequest.inRoutingFareCalculator.type,
            time: this.state.profileRequest.fromTime,
            date: this.state.profileRequest.date
        }

        window.location.hash = '#' + encodeURIComponent(JSON.stringify(hashState))

        fetch('/pareto', { // TODO hardcoded URL
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.state.profileRequest)
        })
        .then(async (res) => {
            if (res.ok) {
                const json = await res.json()
                this.props.setError(null)
                this.props.setResults(json)
            } else {
                this.props.setError(await res.text())
                this.props.setResults(null)
            }
        })
    }

    render () {
        return <div class="paretoControls">
            <ODMap setCoords={this.setRequestFields} coords={this.state.profileRequest} result={this.props.result} tripIndex={this.props.tripIndex} />

            <form onSubmit={this.handleSubmit}>
                <table>
                    <tbody>
                        <tr>
                            <td><label for="fareCalculatorType">Fare calculator type</label></td>
                            <td><input type="text" name="fareCalculatorType" id="fareCalculatorType" value={this.state.profileRequest.inRoutingFareCalculator.type} onChange={this.setFareCalculatorType} /></td>
                        </tr>
                        <tr>
                            <td><label for="date">Date</label></td>
                            <td><input type="date" name="date" id="date" value={this.state.profileRequest.date} onChange={this.setDate} /></td>
                        </tr>
                        <tr>
                            <td><label for="fromTime">Time</label></td>
                            <td><input type="time" name="fromTime" id="fromTime" value={secondsToTime(this.state.profileRequest.fromTime)} onChange={this.setFromTime} /></td>
                        </tr>
                        <tr>
                            <td colspan={2}><input type="submit" value="Route" /></td>
                        </tr>
                    </tbody>
                </table>
            </form>
        </div>
    }
}