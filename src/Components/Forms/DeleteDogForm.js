import React, { useState } from "react";
import styled from "styled-components";
import DogsApiService from "../../services/api-service";
import ValidationError from "../ValidationError/ValidationError";
import Button from "../UI/Button";

const DeleteDogForm = ({
	selectedDogs,
	resetSelected,
	setModal,
	updateDogs,
	setChecked,
}) => {
	const [error, setError] = useState(null);

	const onSubmit = () => {
		Promise.all(
			selectedDogs.map((dogId) => DogsApiService.deleteDog(dogId))
		).then((response) => {
			if (!response) {
				setError("Something wrong happened. Try again later.");
			}

			resetSelected([]);
			setModal(false);
			updateDogs();
		});
	};

	const closeUpdateStatusForm = () => {
		resetSelected([]);
		setModal(false);
		setChecked(false);
	};

	return (
		<DeleteFormStyles>
			<p>Once you delete a dog, it will be gone forever.</p>
			{error && <ValidationError message={error} />}
			<div className="button-container">
				<Button handleClick={() => closeUpdateStatusForm()}>Cancel</Button>
				<Button handleClick={() => onSubmit()}>Delete</Button>
			</div>
		</DeleteFormStyles>
	);
};

const DeleteFormStyles = styled.div`
	.button-container {
		display: flex;
		justify-content: space-evenly;
	}
`;

export default DeleteDogForm;
