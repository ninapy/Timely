import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import Modal from './Modal';

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [client, setClient] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const google = window.google;
    const client = google.accounts.oauth2.initTokenClient({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/calendar',
      callback: handleTokenResponse
    });
    setClient(client);
  }, []);

  const handleTokenResponse = async (response) => {
    if (response.access_token) {
      setAccessToken(response.access_token);
      fetchEvents(response.access_token);
    }
  };

  const fetchEvents = async (token) => {
    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?' +
        new URLSearchParams({
          timeMin: new Date(new Date().getFullYear(), new Date().getMonth() - 1).toISOString(),
          timeMax: new Date(new Date().getFullYear(), new Date().getMonth() + 2).toISOString(),
          singleEvents: true,
          orderBy: 'startTime'
        }), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      const formattedEvents = (data.items || []).map(event => ({
        id: event.id,
        title: event.summary,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleDateClick = (arg) => {
    setSelectedDate(arg.date);
    setShowModal(true);
  };

  const addEvent = async (eventDetails) => {
    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            summary: eventDetails.title,
            start: {
              dateTime: eventDetails.start.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
              dateTime: eventDetails.end.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
          })
        }
      );
      const newEvent = await response.json();
      setEvents([...events, {
        id: newEvent.id,
        title: newEvent.summary,
        start: newEvent.start.dateTime,
        end: newEvent.end.dateTime
      }]);
      setShowModal(false);
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  return (
    <div>
      {!accessToken ? (
        <button onClick={() => client?.requestAccessToken()}>Sign In</button>
      ) : (
        <>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={events}
            dateClick={handleDateClick}
            height="80vh"
          />
          {showModal && (
            <Modal
              selectedDate={selectedDate}
              onClose={() => setShowModal(false)}
              onSubmit={addEvent}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Calendar;
