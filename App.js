import React, { Component } from 'react';
import {LineChart, Grid, XAxis, YAxis} from 'react-native-svg-charts';
import {Picker} from '@react-native-community/picker';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  Button,
} from 'react-native';

type MyProps = {};
type MyState = { date: string, confirmedData: any, deathData: any, recoveredData: any, country: string, countries: any, page: number}
export default class App extends Component<MyProps, MyState> {
  constructor(props) {
    super(props);

    this.state = {
      date: new Date().toLocaleDateString(),
      confirmedData: null,
      deathData: null,
      recoveredData: null,
      country: 'russia',
      countries: null,
      page: 0
    };
  }

  async componentDidMount() {
    await this.getCountries();
    await this.reload();
  }

  async getCountries() {
    try {
      let url = "https://api.covid19api.com/countries";
      let res = await fetch(url, {method: 'GET', redirect: 'follow'});
      let data = await res.json();
      this.setState({countries: data});
    } catch {
      console.log("Some error in countries gathering. Whatever.")
    }
  }

  async reload() {
    await this.getRecovered(this.state.country);
    await this.getConfirmed(this.state.country);
    await this.getDeaths(this.state.country);
  }

  async getConfirmed(country) {
    try {
      let date = new Date().toISOString();
      let url = "https://api.covid19api.com/total/country/" + country + "/status/confirmed?from=2020-01-01T00:00:00Z&to=" + date;
      let res = await fetch(url, {method: 'GET', redirect: 'follow'});
      let data = await res.json();
      this.setState({confirmedData: data});
    } catch {
      console.log("Some error in data gathering for " + country + " for confirmed occured. Whatever.")
    }
  }

  async getDeaths(country) {
    try {
      let date = new Date().toISOString();
      let url = "https://api.covid19api.com/total/country/" + country + "/status/deaths?from=2020-01-01T00:00:00Z&to=" + date;
      let res = await fetch(url, {method: 'GET', redirect: 'follow'});
      let t = await res.text();
      let data = JSON.parse(t);
      this.setState({deathData: data});
    } catch {
      console.log("Some error in data gathering for " + country + " for deaths occured. Whatever.")
    }
  }

  async getRecovered(country) {
    try {
      let date = new Date().toISOString();
      let url = "https://api.covid19api.com/total/country/" + country + "/status/recovered?from=2020-01-01T00:00:00Z&to=" + date;
      let res = await fetch(url, {method: 'GET', redirect: 'follow'});
      let t = await res.text();
      let data = JSON.parse(t);
      this.setState({recoveredData: data});
    } catch {
      console.log("Some error in data gathering for " + country + " for recovered occured. Whatever.")
    }
  }

  render() {
    let picker = null;
    if (this.state.countries != null) {
      let pickerData = [];
      let i;
      let data = this.state.countries;
      for (i = 0; i < data.length; ++i) {
        pickerData.push({label: data[i].Country, value: data[i].Slug});
      }

      picker =
        <View style={styles.sectionContainer}>
          <Picker
            mode="dropdown"
            selectedValue={this.state.country}
            onValueChange={async (itemValue, itemIndex) => {
                await this.setState({country: itemValue.toString()});
                await this.setState({confirmedData: null, deathData: null, recoveredData: null});
                await this.reload();
                await this.setState({date: new Date().toLocaleDateString()})
              }
            }
            style={{backgroundColor: 'white'}}
          >
            {
              pickerData.map((item) => {
                return(
                  <Picker.Item label={item.label} value={item.value} key={item.value}></Picker.Item>
                )
              })
            }
          </Picker>
      </View>;
    }

    let detailsList = null;
    if (this.state.confirmedData != null && this.state.deathData != null && this.state.recoveredData != null) {
      let i;
      let conf = this.state.confirmedData;
      let dead = this.state.deathData;
      let recv = this.state.recoveredData;
      let detailsData = [];
      for (i = conf.length - 1; i >= 0; --i) {
        if (i > 0) {
          detailsData.push({confirmed: conf[i].Cases - conf[i - 1].Cases, dead: dead[i].Cases - dead[i - 1].Cases, recovered: recv[i].Cases - recv[i - 1].Cases, date: new Date(conf[i].Date).toLocaleDateString() });
        } else {
          detailsData.push({confirmed: conf[i].Cases, dead: dead[i].Cases, recovered: recv[i].Cases, date: new Date(conf[i].Date).toLocaleDateString() });
        }
      }

      detailsList = 
        <View style={styles.sectionContainer}>
          <Text style={styles.detailsText}>Date: confirmed / dead / recovered</Text>
          {
            detailsData.map((item) => {
              return(
                <Text key={item.date} style={styles.detailsText}>{item.date}: {item.confirmed} / {item.dead} / {item.recovered}</Text>
              );
            })
          }
        </View>
    }

    let screen = null;
    if (this.state.page == 0) {
      screen =
        <View style={styles.body}>
          <View style={styles.sectionContainer}>
            <Text style={styles.dateText}>{this.state.date}</Text>
          </View>

          {picker}
          <Overview confirmed={this.state.confirmedData} deaths={this.state.deathData} recovered={this.state.recoveredData}/>
          <Chart data={this.state.confirmedData} title="Confirmed"/>
          <Chart data={this.state.deathData} title="Deaths"/>
          <Chart data={this.state.recoveredData} title="Recovered"/>
          {this.state.confirmedData != null && this.state.deathData != null ? <Button onPress={() => { this.setState({page: 1}); }} title="Details"/> : null}
        </View>
    } else {
      screen =
        <View style={styles.body}>
          <Button onPress={() => { this.setState({page: 0}); }} title="Back to overview"/>
          {detailsList}
        </View>
    }

    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scrollView}>
        {screen}
      </ScrollView>
    );
  }
}

function Overview(props) {
  let confirmed = props.confirmed;
  let deaths = props.deaths;
  let recovered = props.recovered;

  if (confirmed == null || deaths == null || recovered == null) {
    return (
      <View style={styles.sectionContainer}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    )
  }

  return(
      <View style={styles.sectionContainer}>
        <Text style={styles.overviewText}>Confirmed: {confirmed.length > 0 ? confirmed[confirmed.length - 1].Cases : "..."}</Text>
        <Text style={styles.overviewText}>Deaths: {deaths.length > 0 ? deaths[deaths.length - 1].Cases : "..."}</Text>
        <Text style={styles.overviewText}>Infected now: {confirmed.length == 0 || deaths.length == 0 || recovered.length == 0 ? "..." : confirmed[confirmed.length - 1].Cases - deaths[deaths.length - 1].Cases - recovered[recovered.length - 1].Cases}</Text>
      </View>
  );
}

function Chart(props) {
  let data = props.data;
  let title = props.title;

  if (data == null) {
    return null;
  }

  let casesData = [];
  let i;
  let last = 0;
  for (i = 0; i < data.length; ++i) {
    let m = new Date(data[i].Date)
    casesData.push({ value: data[i].Cases - last, date: m });
    last = data[i].Cases;
  }

  const contentInset = {top: 10, bottom: 10};
  const xAxisHeight = 50;

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.overviewText}>{title}</Text>
      <ScrollView horizontal={true}>
        <View style={{width: 2000, height: 500, flexDirection: 'row', padding: 10}}>
          <YAxis
            data={casesData}
            style={{marginBottom: xAxisHeight}}
            yAccessor={ ({item}) => item.value}
            contentInset={contentInset}
            svg={{fill: 'black', fontSize: 14}}
            numberOfTicks={12}
          />
          <View style={{flex: 1, marginLeft: 10}}>
            <LineChart
              style={{flex: 1}}
              data={casesData}
              yAccessor={ ({item}) => item.value}
              xAccessor={ ({ item }) => item.date }
              svg={{ stroke: 'red'}}
              contentInset={contentInset}
            >
              <Grid />
            </LineChart>
            <XAxis
              style={{marginHorizontal: -10, height: xAxisHeight}}
              data={casesData}
              xAccessor={ ({ item }) => item.date }
              numberOfTicks={casesData.length / 4}
              formatLabel={(value) => new Date(value).toLocaleDateString()}
              contentInset={{left: 10, right: 10}}
              svg={{fill: 'black', fontSize: 12, rotation: 0}}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#f5f5f5',
  },
  body: {
    backgroundColor: '#0288d1',
  },
  sectionContainer: {
    marginTop: 28,
    paddingBottom: 10,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  chartContainer: {
    backgroundColor: 'white',
    marginTop: 28,
    paddingBottom: 10,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  dateText: {
    fontSize: 40,
    fontWeight: '800',
    textAlign: 'center'
  },
  overviewText: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center'
  },
  detailsText: {
    fontSize: 22,
    fontWeight: '500',
    textAlign: 'center'
  }
});