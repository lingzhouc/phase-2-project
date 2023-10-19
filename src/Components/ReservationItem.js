import { useState } from "react";
import { useOutletContext } from "react-router-dom";

const defaultResForm = {
    id: "",
    name: "",
    phoneNumber: "",
    guests: "",
    date: "",
    table: "",
    time: "",
}

function ReservationItem({res, clickOnReservation, selectedReservation}) {
    const {id, name, phoneNumber, date, time, guests, table} = res;
    const [editResForm, setEditResForm] = useState(defaultResForm)

    const {handleChangeReservation, handleReservationDelete, friRez, satRez, setFriRez, setSatRez} = useOutletContext()
    
    function handleClick() {
        clickOnReservation(res)
    }

    function handleChange(event) {
        setEditResForm({
            ...editResForm,
            [event.target.name]: event.target.value
        })
    }

    // used in handleSubmit and deleteReservation
    const originalTableDB = (date === "friday") ? friRez : satRez;
    const originalTableDBUpdate = (date === "friday") ? setFriRez : setSatRez;
    const originalSeating = (time === "7:30" ? "1930-seating" : "2100-seating");

    function handleSubmit(event) {
        event.preventDefault();
        let changedReservation = {...editResForm}
        for (let key in changedReservation) {
            if (!changedReservation[key]) {
                changedReservation[key] = res[key]
            }
        }
        if (changedReservation.table !== table) {
            const newTableDb = (changedReservation.date === "friday") ? friRez : satRez;
            const newTableDBUpdate = (changedReservation.date === "friday") ? setFriRez : setSatRez;
            const newSeating = (changedReservation.time === "7:30" ? "1930-seating" : "2100-seating");
            // update current table
            fetch(`http://localhost:3001/${date}_tables/${table}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({[originalSeating]: true})
            })
            .then(resp => resp.json())
            .then(oldTable => {
                originalTableDBUpdate(() => originalTableDB.map(table => {
                    if(table.id === oldTable.id) {
                        return oldTable
                    } else return table
                }));
                // update new table
                fetch(`http://localhost:3001/${changedReservation.date}_tables/${changedReservation.table}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({[newSeating]: false})
                })
                .then(resp => resp.json())
                .then(newTable => newTableDBUpdate(() => newTableDb.map(table => {
                    if(table.id === newTable.id) {
                        return newTable
                    } else return table
                })))
            })
        }
        // update reservation
        fetch(`http://localhost:3001/reservations/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(changedReservation)
        })
        .then(resp => resp.json())
        .then(updatedRes => {
            handleChangeReservation(updatedRes);
            setEditResForm(defaultResForm)
        })
    }

    function clearFormContent() {
        setEditResForm(defaultResForm)
    }

    function deleteReservation() {
        fetch(`http://localhost:3001/reservations/${id}`, {
            method: "DELETE"
        })
        .then(() => {
            fetch(`http://localhost:3001/${date}_tables/${table}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({[originalSeating]: true})
            })
            .then(resp => resp.json())
            .then(revisedTable => {
                originalTableDBUpdate(() => originalTableDB.map(table => {
                    if(table.id === revisedTable.id) {
                        return revisedTable
                    } else return table
                }))
            });
        })
        handleReservationDelete(id);
    }

    const reservationChange = () => {
        return (
            <>
                <form id="res-edit" onSubmit={handleSubmit}>
                    <label htmlFor="phoneNumber">Phone Number: </label>
                    <input 
                        name="phoneNumber" 
                        type="text" 
                        value={editResForm.phoneNumber} 
                        onChange={handleChange}
                    />
                    <br/>
                    <label htmlFor="date">Day: </label>
                    <select 
                        className="dropdown" 
                        name="date" 
                        value={editResForm.date} 
                        onChange={handleChange}
                    >
                        <option value=""></option>
                        <option value="friday">Friday</option>
                        <option value="saturday">Saturday</option>
                    </select>
                    <br />
                    <label htmlFor="time">Time: </label>
                    <select 
                        className="dropdown" 
                        name="time" 
                        value={editResForm.time} 
                        onChange={handleChange}
                    >
                        <option value=""></option>
                        <option value="7:30">7:30</option>
                        <option value="9:00">9:00</option>
                    </select>
                    <br />
                    <label htmlFor="guests">Guests: </label>
                    <select 
                        className="dropdown" 
                        name="guests" 
                        value={editResForm.guests} 
                        onChange={handleChange}
                    >
                        <option value=""></option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                    </select>
                    <br/>
                    <label htmlFor="table">Table: </label>
                    <select 
                        className="dropdown" 
                        name="table" 
                        value={editResForm.table} 
                        onChange={handleChange}
                    >
                        <option value=""></option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                    </select>
                    <br/>
                    <input type="submit" value="Change Reservation" />
                    <button onClick={clearFormContent}>Clear Changes</button>
                </form>
                    <button onClick={deleteReservation}>Delete Reservation</button>
            </>
        )
    }

    return (
        <li className="reservationItem" id={name+table} onClick={handleClick} >
            <div>
                <p>{name} ({phoneNumber})</p>
                <p>Day and time: {date}, {time}</p>
                <p>Number of Guests: {guests}</p>
                <p>Table: {table}</p>
            </div>
            {(selectedReservation.id === id) ? reservationChange() : null}
        </li>
    )
}

export default ReservationItem;