import React from "react"
import {find} from "lodash"
import Header from './Header.jsx';
import BoardSelector from './BoardSelector.jsx'
import ListSelector from './ListSelector.jsx'
import LabelSelector from './LabelSelector.jsx'
import queryString from "query-string";
import Footer from "./Footer.jsx"


class ColumnSelection extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      boards: [],
      lists: [],
      labels: [],
      groupedboards: [],
      organizations: [],
      fromExtension: false
    }
    this.getBoardColumns = this.getBoardColumns.bind(this);
    this.retrieveCardsByListId = this.retrieveCardsByListId.bind(this);
    this.handleBoardClicked = this.handleBoardClicked.bind(this);
    this.handleListClicked = this.handleListClicked.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.labelSelected = this.labelSelected.bind(this);
  }

  componentDidMount () {
    var Trello = this.props.Trello;

    var that = this;
    const params = queryString.parse(location.search);

    if (params.boardId !== undefined && params.listName !== undefined) {
      alert("Looks like you are using and outdated version of the Sortello Chrome Extension, please update. Thank you!");
    }

    if (params.extId !== undefined) {
      that.setState({
        fromExtension: true
      });
      Trello.cards.get(params.extId, null, function (card) {
        that.retrieveCardsByListId(card.idList)
      });
    }

    if (this.state.organizations.length > 0) {
      return;
    }

    Trello.members.get('me', {
      organizations: "all",
      organization_fields: "all",
      boards: "open",
      board_lists: "open"
    }, function (data) {
      var boardGroups = [];
      var boards = data.boards;
      var organizations = data.organizations;
      for (var i = 0; i < boards.length; i++) {
        var organization = find(organizations, {'id': boards[i].idOrganization});
        var groupName = "Other";
        if (organization !== undefined) {
          groupName = organization.displayName;
        }
        if (!boardGroups[groupName]) {
          boardGroups[groupName] = [];
        }
        boardGroups[groupName].push(boards[i]);
      }
      that.setState({
        boards: boards,
        groupedboards: boardGroups,
        organizations: organizations
      })

    }, function (e) {
      console.log(e);
    });
  }

  labelSelected (labelId) {
    let listCards = this.state.listCards;
    if (labelId !== 0) {
      let label = find(this.state.labels, {'id': labelId});
      listCards = _.filter(this.state.listCards, function (card) {
        return find(card.labels, {'id': label.id}) !== undefined;
      });
    }
    this.props.handleCards(listCards);
  }

  retrieveCardsByListId (listId) {
    let that = this;
    let labels = [];
    this.props.Trello.lists.get(listId, {cards: "open"}, function (data) {
      var listCards = data.cards;
      that.setState({
        listCards: listCards
      });
      console.log(listCards);
      listCards.forEach(function (card) {
        card.labels.forEach(function (label) {
          if (find(labels, {'id': label.id}) === undefined) {
            labels.push(label);
          }
        });
      })
      that.setState({
        labels: labels
      }, function () {
        if (this.state.labels.length === 0) {
          that.labelSelected(0)
        }
      });
    }, function (e) {
      console.log(e);
    });
  }

  getBoardColumns (board) {
    this.setState({
      lists: board.lists
    });
  }

  handleBoardClicked (boardId) {

    var board = find(this.state.boards, {'id': boardId});

    this.getBoardColumns(board)
  }

  handleListClicked (listId) {
    var list = find(this.state.lists, {'id': listId});
    this.retrieveCardsByListId(list.id);
  }

  render () {
    return (
      <div id="card_url_div">
        <div className="selection__wrapper">
          <div className="selection__container selection__container--animation">
            <div className="select-list--text-container selection__heading">
              {
                (this.state.fromExtension === true) ?
                  "Filter by label, or select All" :
                  "First of all, select the board you want to prioritize"
              }
            </div>
            <div className="">
              {
                (this.state.fromExtension === true) ?
                  "" :
                  <BoardSelector groupedboards={this.state.groupedboards}
                                 onChange={this.handleBoardClicked}></BoardSelector>
              }
            </div>
            {
              (this.state.lists.length === 0 || this.state.fromExtension === true) ?
                "" :
                <p><ListSelector lists={this.state.lists} onChange={this.handleListClicked}></ListSelector></p>
            }


            {
              this.state.labels.length === 0 ?
                "" :
                <LabelSelector labels={this.state.labels} onClick={this.labelSelected}></LabelSelector>
            }
          </div>
          <div className={"footer footer--animated"}>
            <Footer/>
            <Header/>
          </div>
        </div>
      </div>
    )
  }
}

export default ColumnSelection