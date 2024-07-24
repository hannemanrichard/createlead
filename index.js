const cron = require("node-cron");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const supabaseUrl = "https://esgaekqgpyboghjhpwsk.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZ2Fla3FncHlib2doamhwd3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzI3NTEwNDAsImV4cCI6MTk4ODMyNzA0MH0.fVkl55mCYAz2ZfmOpyFxY0bZKfJqvLpcz6cn2F7vHDY";

const supabase = createClient(supabaseUrl, supabaseKey);

// cron.schedule(
//   "1,4,7,10,13,16,19,22,25,28,31,34,37,40,43,46,49,52,55,58 * * * *",
//   async () => {

function changeTimeZone(date, timeZone) {
  if (typeof date === "string") {
    return new Date(
      new Date(date).toLocaleString("en-US", {
        timeZone,
      })
    );
  }

  return new Date(
    date.toLocaleString("en-US", {
      timeZone,
    })
  );
}

function formatDateTime() {
  const date = new Date();

  // Get date parts
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // Get time parts
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  // Format date and time
  const formattedDate = `${year}-${month}-${day}`;
  const formattedTime = `${hours}:${minutes}:${seconds}`;

  return `${formattedDate} ${formattedTime}`;
}

const start = async () => {
  console.log("running a task on schedule");
  try {
    // Retrieve parcels payment_status=not-ready&
    let parcels = []
    let arr = []
    for (let i = 1; i < 22; i++) {
      const parcelsResponse = await axios.get(
          `https://app.conexlog-dz.com/api/v1/get/orders?api_token=9bwwR9RRZfUCcNtjnu4IrQyy3DULSohTiWg2ydQZMLGxh21DrapIueF3FCk5&page=${i}`,
      );
      console.log(`API called: ${i}`)
      parcelsResponse.data.data.forEach((parcel) => {
          if (parcel.status) {
            let orderStatus;
            const deliveredStatus = ['encaissé_non_payé', 'livré_non_encaissé', 'payé_et_archivé', 'paiements_prets']
            const returnedStatus = ['retour_chez_livreur', 'retour_transit_entrepot', 'retour_en_traitement', 'retour_reçu', 'retour_archive', 'annule']

            if (deliveredStatus.includes(parcel.status)) {
              orderStatus = 'delivered'
            }
            else if (returnedStatus.includes(parcel.status)) {
              orderStatus = 'returned'
            } else if (parcel.status === 'prete_a_expedier') {
              orderStatus = 'initial'
            } else {
              orderStatus = 'processing'
            }


            parcels.push({
              tracking: parcel.tracking,
              last_status: parcel.status,
              status: orderStatus
            })
            /*if (!!orderStatus) {

            } else {
              parcels.push({
                tracking: parcel.tracking,
                last_status: parcel.status
              })
            }*/
            //console.log(orderStatus)
          } else {

            parcels.push({
              tracking: parcel.tracking,
              status: 'processing',
            })
            //console.log('processing')
          }
      }
      );
    }

    const currentDate = formatDateTime();

    for (const parcel of parcels) {
      const index = parcels.indexOf(parcel);
      const {data, error} = await supabase
          .from('orders')
          .select()
          .eq('tracking_id', parcel.tracking)
          .single()

      if (data && data.dc_recent_status !== parcel.last_status) {
        console.log(parcel.last_status)
        let dataOrder, errorOrder;
        if (data.status !== 'delivered' && data.status !== 'returned') {
          if (data.status !== parcel.status) {
            const {data: dataLocal, error: errorLocal} = await supabase
                .from('orders')
                .update({
                  dc_recent_status: parcel.last_status,
                  modified_at: currentDate,
                  status: parcel.status
                })
                .eq('tracking_id', parcel.tracking)
                .select()
            dataOrder = dataLocal;
            errorOrder = errorLocal;
          } else {
            const {data: dataLocal, error: errorLocal} = await supabase
                .from('orders')
                .update(parcel.last_status ? {
                  dc_recent_status: parcel.last_status,status: parcel.status
                } : {status: parcel.status})
                .eq('tracking_id', parcel.tracking)
                .select()
            dataOrder = dataLocal;
            errorOrder = errorLocal;
          }


          if (data) {
            console.log(`${parcel.tracking} successfully modified! from ${data.dc_recent_status} to ${parcel.last_status}`)
          }

          if (error) {
            console.log(`${parcel.tracking} error occured!`)
          }
        }
      }
    }


  } catch (error) {
    console.log(error);
  }
};

start();
