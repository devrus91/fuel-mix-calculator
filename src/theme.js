import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        primary: {
            main: "#1976d2", // Синий цвет
        },
        secondary: {
            main: "#f50057", // Розовый цвет
        },
    },
    typography: {
        fontFamily: "Roboto, Arial, sans-serif",
    },
});

export default theme;