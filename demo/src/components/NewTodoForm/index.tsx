import "./styles.css";
import React, { useState } from "react";

interface Props {
  onSubmit: (value: string) => void;
}

const NewTodoForm: React.FC<Props> = ({ onSubmit }) => {
  const [value, setValue] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(value);
    setValue("");
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSubmit(event as React.FormEvent);
    }
  };

  return (
    <div className="form" key="form">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default NewTodoForm;
