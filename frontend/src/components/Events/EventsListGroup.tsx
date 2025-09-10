import "./EventsListGroup.css";

const EventsListGroup: React.FC<{ children: React.ReactNode, title: string }> = ({ children, title }) => {
  return (
    <div className="events-list-group">
      <h3 className="events-list-group__title">
        {title}
      </h3>

      {children}    
    </div>
  );
};

export default EventsListGroup;