import React, {
  useReducer,
  useCallback,
  useState,
  useLayoutEffect,
} from 'react'
import { Link } from 'react-router-dom'
import DogsApiService from '../../services/api-service'
import './AddNewDog.css'
import ValidationError from '../../Components/ValidationError/ValidationError'
import Validate from '../../Utils/validation'
import Format from '../../Utils/format'
import styled from 'styled-components'

import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

import TokenService from '../../services/token-service.js'

const TEXT_INPUT = 'TEXT_INPUT'
const IMG_INPUT = 'IMG_INPUT'
const SHOT_INPUT = 'SHOT_INPUT'

const formReducer = (state, action) => {
  switch (action.type) {
    case TEXT_INPUT:
      return {
        ...state,
        inputText: { ...state.inputText, [action.label]: action.value },
        touched: { ...state.touched, [action.label]: true },
      }
    case IMG_INPUT:
      const updatedImage = {
        //make url and path in update Image
        file: action.file,
        imagePreview: action.url,
      }
      return {
        ...state,
        image: updatedImage,
      }

    case SHOT_INPUT:
      return {
        ...state,
        shots: { ...state.shots, [action.label]: action.date },
      }

    default:
      return state
  }
}

const AddNewDog = (props) => {
  const shelterId = TokenService.getShelterToken()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [state, dispatch] = useReducer(formReducer, {
    inputText: {
      name: '',
      gender: '',
      microchip_number: '',
      microchip_date: '',
      tag_number: '',
      age: '',
      arrival_date: '',
    },
    image: {
      file: '',
      imagePreview: '',
    },
    shots: {
      'Spayed/Neutered': '',
      Rabies: '',
      'Complex I': '',
      'Complex II': '',
      'Complex Yearly Booster': '',
    },
    touched: {
      name: false,
    },
  })

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [shelterId])

  const makeDogObj = () => {
    const arrDateStr = Format.stringifyDate(state.inputText.arrival_date)
    const ageStr = Format.stringifyDate(state.inputText.age)
    const microchipDate =
      state.inputText.microchip_date === ''
        ? Format.stringifyDate(new Date())
        : Format.stringifyDate(state.inputText.microchip_date)

    const newDog = [
      { dog_name: state.inputText.name },
      { gender: state.inputText.gender },
      {
        microchip_date: microchipDate,
      },
      { microchip: state.inputText.microchip_number },
      { tag_number: state.inputText.tag_number },
      { age: ageStr },
      { arrival_date: arrDateStr },
      { shelter_id: shelterId },
    ]

    const formData = new FormData()
    formData.append('profile_img', state.image.file)

    newDog.forEach((i) => {
      formData.append(Object.keys(i), Object.values(i))
    })

    return formData
  }

  const makeShotsArray = () => {
    let shotList = []
    for (const shot in state.shots) {
      const dateStr = Format.stringifyDate(state.shots[shot])
      const obj = {
        shot_name: shot,
        shot_date: !state.shots[shot] ? null : dateStr,
        shot_iscompleted: !state.shots[shot] ? false : true,
      }
      shotList.push(obj)
    }
    return shotList
  }

  const handleChange = useCallback(
    (e, label, value) => {
      if (label === 'gender') {
        dispatch({ type: 'TEXT_INPUT', label: label, value: value })
      } else if (
        label === 'age' ||
        label === 'arrival_date' ||
        label === 'microchip_date'
      ) {
        dispatch({ type: 'TEXT_INPUT', label: label, value: e })
      } else if (label === 'image') {
        const url = URL.createObjectURL(e.target.files[0])
        const file = e.target.files[0]
        dispatch({
          type: 'IMG_INPUT',
          label: label,
          url: url,
          file: file,
        })
      } else {
        dispatch({ type: 'TEXT_INPUT', label: label, value: e.target.value })
      }
    },
    [dispatch]
  )

  const handleShotChange = (date, label) => {
    dispatch({ type: 'SHOT_INPUT', label: label, date: date })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const newDogObj = makeDogObj()
    const shotsObj = makeShotsArray()

    DogsApiService.insertNewDog(newDogObj)
      .then((res) => {
        shotsObj.map((i) => (i.dog_id = res.id))
        shotsObj.map((shot) => DogsApiService.insertNewShot(shot))
      })
      .then((res) => props.history.push('/dogs-list'))
      .catch((error) => {
        setError(error.message)
      })
  }

  return (
    <AddDogStyles
      className="add-dog-container"
      preview={state.image.imagePreview}
    >
      <h1 className="form-title">Add New Dog</h1>

      <form className="form-container" onSubmit={(e) => handleSubmit(e)}>
        <div className="field-item">
          <label htmlFor="name" className="bold">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={state.inputText.name}
            className="block"
            onChange={(e) => handleChange(e, 'name')}
            required
          />
          {state.touched.name && (
            <ValidationError
              message={Validate.validateName(state.inputText.name)}
            />
          )}
        </div>

        <div className="field-item">
          <label htmlFor="image" className="bold">
            Image
          </label>
          <input
            className="block"
            type="file"
            name="profileImg"
            onChange={(e) => handleChange(e, 'image')}
            accept="image/*"
            required
          />
          <img
            className="img-preview"
            src={state.image.imagePreview}
            alt="your-pic"
          />
        </div>

        <fieldset className="field-item">
          <legend className="bold">Gender</legend>
          <label htmlFor="male">
            <input
              type="radio"
              name="gender"
              value="Male"
              onChange={(e) => handleChange(e, 'gender', 'Male')}
              id="male"
              required
            />
            Male
          </label>

          <label htmlFor="female">
            <input
              type="radio"
              name="gender"
              value="Female"
              onChange={(e) => handleChange(e, 'gender', 'Female')}
              id="female"
            />
            Female
          </label>
        </fieldset>

        <label htmlFor="estimated-age" className="bold">
          Estimated Birthdate
        </label>
        <DatePicker
          dateFormat="dd/MM/yyyy"
          selected={state.inputText.age}
          onChange={(e) => handleChange(e, 'age')}
          placeholderText="Click to select a date"
          id="age"
          className="block"
          showYearDropdown
          dateFormatCalendar="MMMM"
          yearDropdownItemNumber={5}
          scrollableYearDropdown
        />
        <label htmlFor="arrival" className="bold">
          Estimated Arrival
        </label>

        <DatePicker
          dateFormat="dd/MM/yyyy"
          selected={state.inputText.arrival_date}
          placeholderText="Click to select a date"
          onChange={(e) => handleChange(e, 'arrival_date')}
          id="arrival"
          className="block"
        />
        <label htmlFor="tag-number" className="bold">
          Tag Number
        </label>
        <input
          className="block"
          type="text"
          value={state.inputText.tag_number}
          onChange={(e) => handleChange(e, 'tag_number')}
        />

        <label htmlFor="microchip" className="bold">
          Microchip Number
        </label>
        <input
          className="block"
          type="text"
          name="microchip"
          value={state.inputText.microchip_number}
          onChange={(e) => handleChange(e, 'microchip_number')}
        />

        <label htmlFor="microchip" className="bold">
          Microchip Date
        </label>
        <DatePicker
          dateFormat="dd/MM/yyyy"
          selected={state.inputText.microchip_date}
          placeholderText="Click to select a date"
          onChange={(e) => handleChange(e, 'microchip_date')}
          id="arrival"
          className="block"
        />

        <fieldset className="field-item ">
          <legend className="bold">Required Shots Completed</legend>

          <label htmlFor="Spayed/Neutered">
            Spayed/Neutered
            <DatePicker
              dateFormat="dd/MM/yyyy"
              selected={state.shots['Spayed/Neutered']}
              placeholderText="Click to select a date"
              onChange={(date) => handleShotChange(date, 'Spayed/Neutered')}
              className="shot-date-input"
            />
          </label>

          <label htmlFor="Rabies">
            Rabies{' '}
            <DatePicker
              dateFormat="dd/MM/yyyy"
              selected={state.shots['Rabies']}
              placeholderText="Click to select a date"
              onChange={(date) => handleShotChange(date, 'Rabies')}
              className="shot-date-input"
            />
          </label>

          <label htmlFor="Rabies Yearly Booster">
            Rabies Yearly Booster
            <DatePicker
              dateFormat="dd/MM/yyyy"
              selected={state.shots['Rabies Yearly Booster']}
              placeholderText="Click to select a date"
              onChange={(date) =>
                handleShotChange(date, 'Rabies Yearly Booster')
              }
              className="shot-date-input"
            />
          </label>

          <label htmlFor="Complex I">
            Complex I
            <DatePicker
              dateFormat="dd/MM/yyyy"
              selected={state.shots['Complex I']}
              placeholderText="Click to select a date"
              onChange={(date) => handleShotChange(date, 'Complex I')}
              className="shot-date-input"
            />
          </label>

          <label htmlFor="Complex II">
            Complex II
            <DatePicker
              dateFormat="dd/MM/yyyy"
              selected={state.shots['Complex II']}
              placeholderText="Click to select a date"
              onChange={(date) => handleShotChange(date, 'Complex II')}
              className="shot-date-input"
            />
          </label>

          <label htmlFor="Complex Yearly Booster">
            Complex Yearly Booster
            <DatePicker
              dateFormat="dd/MM/yyyy"
              selected={state.shots['Complex Yearly Booster']}
              placeholderText="Click to select a date"
              onChange={(date) =>
                handleShotChange(date, 'Complex Yearly Booster')
              }
              className="shot-date-input"
            />
          </label>
        </fieldset>

        {/* {this.state.error !== null && (
						<ValidationError
							message={"Something wrong happened. Refresh and try again."}
						/>
					)} */}
        <div className="form-buttons">
          <button className="cancel">
            <Link className="dog-link" to={'/dogs-list'}>
              Cancel
            </Link>
          </button>

          <button
            className="submit"
            type="submit"
            onClick={() => setLoading((prevState) => !loading)}
            // disabled={Validate.validateName(this.state.dogName.value)}
          >
            Submit
          </button>
        </div>
      </form>
      {loading && (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      )}
    </AddDogStyles>
  )
}

const AddDogStyles = styled.main`
  .block {
    display: block;
    font-size: 1em;
    height: 40px;
    padding-left: 10px;
    margin-bottom: 10px;
    width: 100%;
  }

  .bold {
    color: #f7567c;
    font-size: 0.8em;
    font-weight: bold;
  }

  .fielditem {
    height: 80px;
  }

  .shot-date-input {
    display: block;
    text-align: center;
    font-size: 0.8em;
    height: 30px;
    margin: 10px auto 10px auto;
    width: 80%;
  }

  .react-datepicker-wrapper {
    width: 50%;
    display: block;
  }

  .loader-container {
    width: 100%;
    display: flex;
    justify-content: center;
    position: relative;
    bottom: 50vh;
  }

  .img-preview {
    width: 250px;
    display: ${(props) => (!props.preview ? 'none' : 'block')};
  }

  .loader {
    border: 16px solid gray;
    border-radius: 50%;
    opacity: 0.5;
    border-top: 16px solid #ff7300;
    width: 120px;
    height: 120px;
    -webkit-animation: spin 2s linear infinite; /* Safari */
    animation: spin 2s linear infinite;
  }

  /* Safari */
  @-webkit-keyframes spin {
    0% {
      -webkit-transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
    }
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  fieldset {
    display: flex;
    margin: 10px 0px 10px 0px;
    flex-direction: column;
  }
`

export default AddNewDog
