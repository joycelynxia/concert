import React, {useEffect} from 'react'

const CalendarPage: React.FC = () => {
    useEffect(() => {
        fetch('http://localhost:4000/api/test')
          .then(response => response.json())
          .then(data => console.log('Backend Response:', data))
          .catch(error => console.error('Error connecting to backend:', error));
      }, []);

      
    return (
        <div>
            <h2>calendar dates of concerts</h2>
        </div>
    )
}

export default CalendarPage;