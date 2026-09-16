import React from 'react'
import styles from "./registeredCard.module.css"
function UserRegisterdCard(props) {

   function handleEdit(){
    console.log("Edit button CLicked")
    props.onEdit(props.id)
    
 }

 



 function handleDelete(){
    props.OnDelete(props.id)
   
 }

  return (
    <>
        <div className={styles.cardContainer}>
            <div>Name: <strong>{props.name}</strong></div>
            <div>Email:<strong> {props.email}</strong></div>

<div className={styles.btnContainer}>
                <button onClick={handleEdit}>Edit</button>
            <button onClick={handleDelete}>Delete</button>

</div>
        </div>

    </>
  )
}

export default UserRegisterdCard
