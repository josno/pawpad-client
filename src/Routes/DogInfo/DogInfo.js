import React, { Component } from "react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { Link } from "react-router-dom";
import AdoptModal from "../../Components/AdoptModal/AdoptModal";
import ArchiveModal from "../../Components/ArchiveModal/ArchiveModal";
import ModalForm from "../../Components/ImgModalForm/ImgModalForm";

import DogDetailsView from "../../Components/DogDetailsView/DogDetailsView";
import PawPadContext from "../../PawPadContext.js";
import DogsApiService from "../../services/api-service";
import AdoptionDetails from "../../Components/AdoptionDetails/AdoptionDetails";

import "./DogInfo.css";
import moment from "moment";

class DogInfo extends Component {
	static contextType = PawPadContext;
	constructor(props) {
		super(props);
		this.state = {
			dogInfo: "",
			openAdopt: false,
			openArchive: false,
			openProfileImg: false,
			error: null,
		};
		this.formatDate = this.formatDate.bind(this);
		// this.renderSpayedNeutered = this.renderSpayedNeutered.bind(this);
		this.renderShotsCompleted = this.renderShotsCompleted.bind(this);
		this.handleDelete = this.handleDelete.bind(this);
		this.handleArchive = this.handleArchive.bind(this);
		this.updateDogImage = this.updateDogImage.bind(this);
	}

	formatDate(date) {
		const formattedDate = moment(date).format("LL");
		return formattedDate;
	}

	openModal = (e) => {
		const { name } = e.target;
		this.setState({ [name]: true });
	};

	closeModal = (str) => {
		this.setState({ [str]: false });
	};

	handleDelete = () => {
		const { dogId } = this.props.match.params;

		DogsApiService.deleteDog(dogId).then((response) => {
			DogsApiService.deleteNotesByDogId(this.props.match.params.dogId);
			DogsApiService.deleteShotsByDogId(this.props.match.params.dogId);
			this.props.history.push("/dogs-list");
		});
	};

	handleArchive = (str) => {
		const { dogId } = this.props.match.params;
		const dateObj = { archive_date: new Date() };
		const noteObj = {
			type_of_note: "archive",
			notes: str,
			dog_id: dogId,
		};
		DogsApiService.archiveDog(dogId, dateObj)
			.then((response) => DogsApiService.insertNewNote(noteObj))
			.then((response) => {
				DogsApiService.getDogInfo(dogId).then((res) =>
					this.setState({
						openArchive: false,
						dogInfo: res,
					})
				);
			})
			.catch((err) => this.setState({ error: "Can't archive dog." }));
	};

	updateDogImage(e, profileImg) {
		e.preventDefault(e);
		const profile_img = profileImg;

		const formData = new FormData();
		formData.append("profile_img", profile_img);

		DogsApiService.deleteDogImg(formData, this.state.dogInfo.tag_number)
			.then((res) => {
				console.log(res);
				return DogsApiService.uploadDogImg(
					formData,
					this.state.dogInfo.tag_number
				);
			})
			.then((res) => {
				const dogObj = {
					dog_name: this.state.dogInfo.dog_name,
					profile_img: res,
				};
				return DogsApiService.updateDog(dogObj, this.state.dogInfo.id);
			})
			.then((res) => {
				return DogsApiService.getDogInfo(this.state.dogInfo.id);
			})
			.then((res) => {
				this.setState({
					dogInfo: res,
					openProfileImg: false,
				});
			})
			.catch((err) => this.setState({ error: err }));
	}

	renderNavButtons = (dogInfo) => {
		return (
			<div className='nav-buttons'>
				<button className='see-notes'>
					<Link
						className='dog-link'
						to={`/notes-${dogInfo.dog_name}/${dogInfo.id}`}
					>
						Notes
					</Link>
				</button>
				<button
					className='delete'
					name='openAdopt'
					onClick={(e) => this.openModal(e)}
					disabled={
						dogInfo.dog_status === "Adopted" ||
						dogInfo.dog_status === "Archived"
							? true
							: false
					}
				>
					Adopted
				</button>
				<button
					className='delete'
					name='openArchive'
					onClick={(e) => this.openModal(e)}
					disabled={
						dogInfo.dog_status === "Adopted" ||
						dogInfo.dog_status === "Archived"
							? true
							: false
					}
				>
					Archive
				</button>
				<button className='delete' onClick={this.handleDelete}>
					Delete
				</button>
			</div>
		);
	};

	renderModals = (dogInfo) => {
		console.log(dogInfo);
		return (
			<>
				<Modal
					open={this.state.openProfileImg}
					onClose={(e) => this.closeModal("openProfileImg")}
					center
				>
					<ModalForm handleUpdate={this.updateDogImage} />
				</Modal>
				<Modal
					open={this.state.openArchive}
					onClose={(e) => this.closeModal("openArchive")}
					center
				>
					<ArchiveModal
						dogName={dogInfo.dog_name}
						dogId={dogInfo.dogId}
						handleArchive={this.handleArchive}
					/>
				</Modal>
				<Modal
					open={this.state.openAdopt}
					onClose={(e) => this.closeModal("openAdopt")}
					center
				>
					<AdoptModal dogId={dogInfo.id} />
				</Modal>
			</>
		);
	};

	renderShotsCompleted(list) {
		const check = list.map((i) => {
			if (i.shot_iscompleted === false) {
				return (
					<li className='shot-checkbox' key={i.shot_name + "-one"}>
						<span className='indicator-no'>&#10008; </span>
						{i.shot_name}
					</li>
				);
			}
			return (
				<li className='shot-checkbox' key={i.shot_name + "one"}>
					<span className='indicator-yes'>&#10004; </span> {i.shot_name}
					<span className='last-shot-text'>
						Date Completed: {this.formatDate(i.shot_date)}
					</span>
				</li>
			);
		});
		return check;
	}

	renderAdoptionDetails = () => {
		return (
			<div className='adoption-details box-flex'>
				<AdoptionDetails />
			</div>
		);
	};

	renderDogImgName = (obj) => {
		return (
			<div className='dog-name'>
				<img alt='dog-name' className='info-img' src={obj.profile_img} />
				<button
					className='edit-pencil edit-pencil-img'
					name='openProfileImg'
					onClick={(e) => this.openModal(e)}
				>
					&#9998;
				</button>
				<h1 className='dog-name-text'>{obj.dog_name}</h1>
			</div>
		);
	};

	renderDogDetailsView = (props) => {
		return <DogDetailsView dogId={props.dogId} />;
	};

	renderShots = (shotObj) => {
		return (
			<div className='shots-information box-flex'>
				<h3 className='info-title'>Shots Completed</h3>
				<ul className='dog-info-text shot-container'>{shotObj}</ul>
			</div>
		);
	};

	renderUpdateByLine = (obj) => {
		return !obj.updated_by ? (
			""
		) : (
			<div className='updated-by'>
				<p>
					Updated by {obj.updated_by} on{" "}
					{this.formatDate(obj.notes_date_modified)}
				</p>
			</div>
		);
	};

	async componentDidMount() {
		const { dogId } = this.props;
		const res = await DogsApiService.getDogInfo(dogId);
		const resShots = res.shotsCompleted.sort((a, b) =>
			a.shot_name > b.shot_name ? 1 : -1
		);

		this.setState({
			dogInfo: res,
			shots: this.renderShotsCompleted(resShots),
		});
	}

	render() {
		const { dogInfo, shots } = this.state;

		return (
			<main className='dog-info'>
				<div className='grid-container'>
					{this.renderDogImgName(dogInfo)}
					{this.renderNavButtons(dogInfo)}
					{this.renderModals(dogInfo)}
					{this.renderDogDetailsView(this.props)}
					{this.renderShots(shots)}
					{dogInfo.dog_status === "Adopted" && this.renderAdoptionDetails()}
					{/* update css for adoption section to be one less row */}
				</div>
				{this.renderUpdateByLine(dogInfo)}
			</main>
		);
	}
}

export default DogInfo;
