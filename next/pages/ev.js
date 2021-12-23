import * as React from 'react'
import useSWR from 'swr'
import fetch from 'src/lib/fetch'
// mui
import MuiAlert from '@mui/material/Alert'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'

const API_URL = 'http://parkbot/api/wallstreet'
const CARDS = 266

const fetcher = url => global.fetch(url).then(r => r.json())

const getData = (endpoint, initialData) => {
  const { data } = useSWR(endpoint, fetcher, {
    initialData,
    refreshInterval: 1000
  })
  return data
}

const Alert = React.forwardRef(function Alert (props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />
})

const Row = ({ id, name, card, stall, status }) => {
  // console.log(id, name, card, stall, status)
  return (
    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
      <TableCell component='th' scope='row'>
        {name}
      </TableCell>
      <TableCell align='right'>{id}</TableCell>
      <TableCell align='right'>{card}</TableCell>
      <TableCell align='right'>{stall}</TableCell>
      <TableCell align='right'>{status}</TableCell>
    </TableRow>
  )
}

const Queue = ({ id, card, stall }) => {
  // console.log(id, card, stall)
  return (
    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
      <TableCell component='th' scope='row'>
        {id}
      </TableCell>
      <TableCell align='right'>{card}</TableCell>
      <TableCell align='right'>{stall}</TableCell>
    </TableRow>
  )
}

const Stall = ({ nr, status, date, myEv }) => {
  // console.log(nr, status, date, myEv)
  return (
    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
      <TableCell component='th' scope='row'>
        {nr}
      </TableCell>
      <TableCell align='right'>{status}</TableCell>
      <TableCell align='right'>{date}</TableCell>
    </TableRow>
  )
}

export default function Main () {
  // /overview

  const [overview, setOverview] = React.useState({ devices: [], queue: [] })
  const data1 = getData(`${API_URL}/overview`, overview)
  React.useEffect(() => {
    if (data1) setOverview(data1)
  }, [data1])

  // /stalls

  const [stalls, setStalls] = React.useState([])
  const data2 = getData(`${API_URL}/stalls`, stalls)
  React.useEffect(() => {
    if (data2) setStalls(data2)
  }, [data2])

  // actions
  const [card, setCard] = React.useState(1)
  const [error, setError] = React.useState(false)

  const handleCard = event => {
    const value = parseInt(event.target.value)
    if (value < 1 || value > CARDS) {
      setError(true)
    } else {
      setError(false)
    }
    setCard(value)
  }

  const handleEntry = async id => {
    const url = `${API_URL}/entry/${id}/${card}`
    const json = await fetch(url)
    console.log(json)
    setOpen(true)
    const { severity, message } = json
    setResponse({ severity, message })
  }

  const handleExit = async () => {
    const url = `${API_URL}/exit/${card}`
    const json = await fetch(url)
    console.log(json)
    setOpen(true)
    const { severity, message } = json
    setResponse({ severity, message })
  }

  const [open, setOpen] = React.useState(false)
  const [response, setResponse] = React.useState(null)

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    setOpen(false)
  }

  return (
    <Box sx={{ flexGrow: 1, mb: 8 }}>
      <AppBar position='static' sx={{ mb: 3 }}>
        <Container maxWidth='xl'>
          <Toolbar disableGutters>
            <Typography variant='h6' component='div' sx={{ flexGrow: 1 }}>
              Sotefin | myEV API Test
            </Typography>
            <Button color='inherit'>Login</Button>
          </Toolbar>
        </Container>
      </AppBar>
      <Container maxWidth='xl'>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant='h6' gutterBottom>
              Stalls
            </Typography>
            <Alert
              sx={{ mb: 1 }}
              severity='info'
              action={
                <Button color='inherit' size='small' href={`${API_URL}/stalls`}>
                  GET RAW
                </Button>
              }
            >
              Endpoint — <strong>/aps/wallstreet/stalls</strong>
            </Alert>
            <TableContainer component={Paper}>
              <Table
                sx={{ width: '100%' }}
                aria-label='simple table'
                size='small'
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Number</TableCell>
                    <TableCell align='right'>Status</TableCell>
                    <TableCell align='right'>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stalls.length > 0 &&
                    stalls.map((element, key) => (
                      <Stall key={key} {...element} />
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant='h6' gutterBottom>
              Overview
            </Typography>
            <Alert
              sx={{ mb: 1 }}
              severity='info'
              action={
                <Button
                  color='inherit'
                  size='small'
                  href={`${API_URL}/overview`}
                >
                  GET RAW
                </Button>
              }
            >
              Endpoint — <strong>/aps/wallstreet/overview</strong>
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TableContainer component={Paper} sx={{ mb: 3 }}>
                  <Table sx={{ width: '100%' }} aria-label='simple table'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell align='right'>Id</TableCell>
                        <TableCell align='right'>Card</TableCell>
                        <TableCell align='right'>Stall</TableCell>
                        <TableCell align='right'>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {overview.devices.length > 0 &&
                        overview.devices.map((element, key) => (
                          <Row key={key} {...element} />
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <TableContainer component={Paper} sx={{ mb: 3 }}>
                  <Table aria-label='simple table'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Position</TableCell>
                        <TableCell align='right'>Card</TableCell>
                        <TableCell align='right'>Stall</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {overview.queue.length > 0 &&
                        overview.queue.map((element, key) => (
                          <Queue key={key} {...element} />
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
            <Stack
              direction='row'
              justifyContent='center'
              alignItems='center'
              spacing={2}
            >
              <Button
                variant='contained'
                disabled={error}
                onClick={() => handleEntry(1)}
              >
                Entry 1
              </Button>
              <Button
                variant='contained'
                disabled={error}
                onClick={() => handleEntry(2)}
              >
                Entry 2
              </Button>
              <Button
                variant='contained'
                disabled={error}
                onClick={() => handleEntry(3)}
              >
                Entry 3
              </Button>
              <Button variant='contained' disabled={error} onClick={handleExit}>
                Exit
              </Button>
              <Button variant='contained'>Shuffle</Button>
              <TextField
                sx={{ minWidth: 180 }}
                id='standard-basic'
                label='Card'
                type='number'
                value={card}
                error={error}
                helperText='Min 1, Max 266 '
                inputProps={{ min: 1, max: CARDS }}
                onChange={handleCard}
              />
            </Stack>
          </Grid>
        </Grid>
      </Container>
      <Snackbar
        open={open}
        autoHideDuration={5000}
        onClose={handleClose}
        // message={message}
        // action={action}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleClose}
          severity={response?.severity}
          sx={{ width: '100%' }}
        >
          {response?.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
