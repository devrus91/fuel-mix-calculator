import React, { useState, useEffect } from "react";
import {
    ThemeProvider,
    createTheme,
    CssBaseline,
    Box,
    Typography,
    TextField,
    Container,
    Paper,
    Grid,
    Alert,
    Slider,
    Popover,
    IconButton,
    Tooltip,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

function App() {
    // Состояние для темы (оставляем только темную тему)
    const theme = createTheme({
        palette: {
            mode: "dark",
            primary: {
                main: "#00e0ff", // Голубой цвет для текста
            },
            secondary: {
                main: "#2c3e50", // Темно-синий фон
            },
        },
    });

    const savedValues = JSON.parse(localStorage.getItem("inputValues")) || {
        fuel: 0,
        additives: 0,
        currentMix: 0,
        targetMix: 0,
        ethanolPurity: 96, // Начальное значение чистоты спирта (96%)
    };
    // Состояния для входных данных
    const [fuel, setFuel] = useState(savedValues.fuel);
    const [additives, setAdditives] = useState(savedValues.additives);
    const [currentMix, setCurrentMix] = useState(savedValues.currentMix);
    const [targetMix, setTargetMix] = useState(savedValues.targetMix);
    const [ethanolPurity, setEthanolPurity] = useState(savedValues.ethanolPurity);

    // Состояние для ошибок
    const [error, setError] = useState("");
    const [ethanolResult, setEthanolResult] = useState(null);
    const [totalVolume, setTotalVolume] = useState(null);

    useEffect(() => {
        localStorage.setItem(
            "inputValues",
            JSON.stringify({ fuel, additives, currentMix, targetMix, ethanolPurity })
        );
    }, [fuel, additives, currentMix, targetMix, ethanolPurity]);
    
    // Состояние для Popover
    const [anchorEl, setAnchorEl] = useState(null);

    // Функция для открытия Popover
    const handleInfoClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    // Функция для закрытия Popover
    const handleClose = () => {
        setAnchorEl(null);
    };

    // Функция для расчета количества этанола и общего объема
    const calculateResults = () => {
        if (fuel < 0) {
            setError("Объем топлива должен быть положительными.");
            return;
        }
        if (additives < 0) {
            setError("Присадки должны быть положительными.");
            return;
        }
        if (currentMix < 0) {
            setError("Текущее содержание этанола должно быть положительными.");
            return;
        }
        if (targetMix < 0) {
            setError("Целевое содержание этанола должно быть положительными.");
            return;
        }
        if (additives > 100 || currentMix > 100 || targetMix > 100) {
            setError("Значения процентов не могут превышать 100.");
            return;
        }
        if (targetMix < currentMix) {
            setError("Целевое содержание этанола должно быть больше текущего.");
            return;
        }
        setError(""); // Очищаем ошибку, если данные корректны// Очищаем ошибку, если данные корректны

        // Плотность этанола (кг/л), бензина (кг/л) и воды (кг/л)
        const ethanolDensity = 0.789; // Плотность этанола
        const fuelDensity = 0.74; // Плотность бензина
        const waterDensity = 1.0; // Плотность воды

        // Объем чистого топлива
        const pureFuel =
            fuel * (1 - additives / 100 - currentMix / 100); // Чистый объем топлива

        // Количество этанола для добавления (с учетом чистоты спирта)
        const ethanolToAddRaw =
            (pureFuel * (targetMix / 100 - currentMix / 100)) / (1 - targetMix / 100);
        const ethanolToAdd = ethanolToAddRaw / (ethanolPurity / 100); // Учитываем чистоту спирта

        // Объем воды в разбавленном спирте
        const waterVolume = ethanolToAdd * ((100 - ethanolPurity) / 100);

        // Масса компонентов
        const pureFuelMass = pureFuel * fuelDensity; // Масса чистого топлива
        const ethanolMass = ethanolToAddRaw * ethanolDensity; // Масса этанола
        const waterMass = waterVolume * waterDensity; // Масса воды
        const additivesMass = (fuel * additives / 100) * fuelDensity; // Масса присадок

        // Общая масса смеси
        const totalMass = pureFuelMass + ethanolMass + waterMass + additivesMass;

        // Расчет средней плотности смеси
        const ethanolFraction = ethanolMass / totalMass; // Доля этанола
        const waterFraction = waterMass / totalMass; // Доля воды
        const fuelFraction = pureFuelMass / totalMass; // Доля бензина
        const additivesFraction = additivesMass / totalMass; // Доля присадок

        const averageDensity =
            ethanolFraction * ethanolDensity +
            waterFraction * waterDensity +
            fuelFraction * fuelDensity +
            additivesFraction * fuelDensity;

        // Расчет контракции объема
        const contractionFactor = 0.97; // Коэффициент контракции (примерное значение)

        // Общий объем топлива с учетом средней плотности и контракции
        const totalFuelVolume = (totalMass / averageDensity) * contractionFactor;


        setEthanolResult(ethanolToAdd.toFixed(2)); // Устанавливаем результат
        setTotalVolume(totalFuelVolume.toFixed(2)); // Устанавливаем общий объем
    };

    // Вызываем calculateResults только при изменении входных данных
    useEffect(() => {
        calculateResults();
    }, [fuel, additives, currentMix, targetMix, ethanolPurity]);
    
    return (
        <ThemeProvider theme={theme}>
            {/* CssBaseline обеспечивает базовые стили для темы */}
            <CssBaseline />
            <Container sx={{ mt: 5,
                backgroundColor: theme.palette.secondary.main,
                color: theme.palette.primary.main,}}>
               
                    <Box textAlign="center" mb={3}>
                        <Typography variant="h4" gutterBottom>
                            Калькулятор этанола
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            Рассчитайте количество этанола и общий объем топлива
                        </Typography>
                    </Box>

                    {/* Вывод сообщения об ошибке */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Разделение формы на две части */}
                    <Grid container spacing={2}>
                        {/* Левая часть формы */}
                        <Grid item size={{ xs: 12, md:12}}>
                            <Typography variant="h6">Параметры топлива</Typography>

                            {/* Объем топлива (поле ввода) */}
                            <Box mt={2}>
                                <Typography variant="body1">Объем топлива (л)</Typography>
                                <TextField
                                    fullWidth
                                    type="number"
                                    value={fuel}
                                    onChange={(e) => setFuel(parseFloat(e.target.value))}
                                    InputProps={{
                                        endAdornment: <Typography ml={1}>л</Typography>,
                                    }}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 0, // Убираем скругления углов
                                        },
                                    }}
                                />
                            </Box>

                            {/* Присадки */}
                            <Box mt={2}>
                                <Typography variant="body1">Присадки (%)</Typography>
                                <TextField
                                    fullWidth
                                    type="number"
                                    value={additives}
                                    onChange={(e) => setAdditives(parseFloat(e.target.value))}
                                    InputProps={{
                                        endAdornment: <Typography ml={1}>%</Typography>,
                                    }}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 0, // Убираем скругления углов
                                        },
                                    }}
                                />
                            </Box>

                            {/* Текущее содержание этанола */}
                            <Box mt={2}>
                                <Typography variant="body1">Текущее содержание этанола (%)</Typography>
                                <TextField
                                    fullWidth
                                    type="number"
                                    value={currentMix}
                                    onChange={(e) => setCurrentMix(parseFloat(e.target.value))}
                                    InputProps={{
                                        endAdornment: <Typography ml={1}>%</Typography>,
                                    }}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 0, // Убираем скругления углов
                                        },
                                    }}
                                />
                            </Box>

                            {/* Целевое содержание этанола */}
                            <Box mt={2}>
                                <Typography variant="body1">Целевое содержание этанола (%)</Typography>
                                <TextField
                                    fullWidth
                                    type="number"
                                    value={targetMix}
                                    onChange={(e) => setTargetMix(parseFloat(e.target.value))}
                                    InputProps={{
                                        endAdornment: <Typography ml={1}>%</Typography>,
                                    }}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 0, // Убираем скругления углов
                                        },
                                    }}
                                />
                            </Box>

                            {/* Чистота спирта */}
                            <Box mt={2}>
                                <Typography variant="body1">Чистота спирта (%)</Typography>
                                <TextField
                                    fullWidth
                                    type="number"
                                    value={ethanolPurity}
                                    onChange={(e) => setEthanolPurity(parseFloat(e.target.value))}
                                    InputProps={{
                                        endAdornment: <Typography ml={1}>%</Typography>,
                                    }}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 0, // Убираем скругления углов
                                        },
                                    }}
                                />
                            </Box>
                        </Grid>

                        {/* Правая часть формы */}
                        <Grid item size={{ xs: 12, md:12}}>
                            <Typography variant="h4" >
                                Необходимо добавить:{" "}
                                <strong>{ethanolResult !== null ? ethanolResult : "-"}</strong> литров этанола.
                            </Typography>

                            <Box mt={3}>
                                

                                {/* Общий объем топлива */}
                                <Box display="flex" alignItems="center" mt={2}>
                                    <Typography variant="h6">Общий объем топлива</Typography>
                                    <IconButton
                                        size="small"
                                        onClick={handleInfoClick}
                                        sx={{ ml: 1 }}
                                    >
                                        <Tooltip title="Информация о расчете">
                                            <InfoOutlinedIcon fontSize="small" />
                                        </Tooltip>
                                    </IconButton>
                                </Box>
                                <Typography variant="body1">
                                    {totalVolume !== null ? `${totalVolume} л` : "-"}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                
            </Container>

            {/* Popover с информацией */}
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                }}
                PaperProps={{
                    sx: {
                        backgroundColor: theme.palette.secondary.main,
                        color: theme.palette.primary.main,
                        p: 2,
                        borderRadius: 2,
                    },
                }}
            >
                <Typography variant="h6" gutterBottom>
                    Расчет общего объема топлива
                </Typography>
                <Typography variant="body1">
                    Общий объем топлива рассчитывается с учетом следующих факторов:
                </Typography>
                <ul>
                    <li>
                        <Typography variant="body1">
                            Плотность бензина: 0.74 кг/л.
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body1">
                            Плотность этанола: 0.789 кг/л.
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body1">
                            Плотность воды: 1.0 кг/л.
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body1">
                            При использовании разбавленного спирта учитывается его чистота
                            (например, 96% спирт содержит 4% воды).
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body1">
                            Присадки учитываются как часть массы топлива.
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body1">
                            Учитывается контракция объема при смешивании жидкостей (коэффициент контракции ~0.97).
                        </Typography>
                    </li>
                </ul>
            </Popover>
        </ThemeProvider>
    );
}

export default App;