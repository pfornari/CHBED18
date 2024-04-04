const botonLogout = document.getElementById("botonLogout");

botonLogout.addEventListener("click", (e) => {
  e.preventDefault();

  fetch("/api/jwt/logout", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((result) => {
      if (result.status === 200) {
        alert("Se ha cerrado la sesión");
      }
    })
    .then(() => {
      window.location.replace("/");
    })
    .catch((error) => {
      console.log(error);
    });
});

const uid = document.getElementById("userID").innerHTML;
const botonCambiar = document.getElementById("switch");
botonCambiar.addEventListener("click", (e) => {
  e.preventDefault();

  fetch(`/api/users/premium/${uid}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((result) => {
      if (result.status === 200) {
        alert("Se ha cambiado su suscripción");
      }
    })
    .then(() => {
       fetch("/api/jwt/logout", {
         method: "GET",
         headers: {
           "Content-Type": "application/json",
         },
       })
    })
    .then(() => {
     return window.location.replace("/");
    })
    .catch((error) => {
      alert("Hubo un error con el cambio de suscripción");
      console.log(error);
    });
});
